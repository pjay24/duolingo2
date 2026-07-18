import random
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db, SessionLocal
from app import models
from app.seed import seed_data

# Global offset to simulate days passing for debugging
SIMULATED_DAY_OFFSET = 0

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def seed_database_on_startup():
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

USER_ID = 1  # Hardcoded for dev environment as per contract

HEART_REGEN_SECONDS = 1800  # 1 heart every 30 minutes
MAX_HEARTS = 5


def apply_heart_regen(user, db: Session):
    """Passively regenerate hearts based on real elapsed time since the last
    heart was lost. Called wherever hearts are read so the value is always
    accurate without needing a background job."""
    if user.hearts >= MAX_HEARTS or user.last_heart_lost_at is None:
        return

    elapsed = (datetime.utcnow() - user.last_heart_lost_at).total_seconds()
    hearts_to_add = int(elapsed // HEART_REGEN_SECONDS)

    if hearts_to_add > 0:
        user.hearts = min(MAX_HEARTS, user.hearts + hearts_to_add)
        if user.hearts >= MAX_HEARTS:
            user.last_heart_lost_at = None
        else:
            # Advance the reference time by however many intervals were
            # consumed, so partial progress toward the next heart isn't lost.
            user.last_heart_lost_at += timedelta(seconds=hearts_to_add * HEART_REGEN_SECONDS)
        db.commit()


def seconds_until_next_heart(user) -> int:
    if user.hearts >= MAX_HEARTS or user.last_heart_lost_at is None:
        return 0
    elapsed = (datetime.utcnow() - user.last_heart_lost_at).total_seconds()
    remaining = HEART_REGEN_SECONDS - (elapsed % HEART_REGEN_SECONDS)
    return max(0, int(remaining))


def get_simulated_today():
    return (datetime.utcnow() + timedelta(days=SIMULATED_DAY_OFFSET)).date()


def get_xp_today(user_id: int, db: Session) -> int:
    """Sum XP from lesson/legendary attempts actually completed 'today'
    (simulated today, so this stays consistent with /api/debug/advance-day)."""
    today = get_simulated_today()
    attempts = db.query(models.LessonAttempt).filter(
        models.LessonAttempt.user_id == user_id,
        models.LessonAttempt.completed_at.isnot(None),
    ).all()
    return sum(a.xp_earned for a in attempts if a.completed_at.date() == today)


def apply_daily_streak(user, today) -> bool:
    """Increment the streak for a new day of activity, but reset it to 1
    if more than one day was missed since the last active day. Returns
    whether the streak changed (i.e. this is the first activity today)."""
    if user.last_active_date == today:
        return False

    days_since_last = (today - user.last_active_date).days if user.last_active_date else None
    if days_since_last is not None and days_since_last > 1:
        user.streak_count = 1  # streak was broken; today restarts it
    else:
        user.streak_count += 1

    user.last_active_date = today
    return True


@app.get("/api/path")
def get_path(db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    apply_heart_regen(user, db)

    units_db = db.query(models.Unit).order_by(models.Unit.order_index).all()
    units_response = []

    for unit in units_db:
        skills_db = db.query(models.Skill).filter(
            models.Skill.unit_id == unit.id
        ).order_by(models.Skill.order_index).all()
        skills_list = []

        for skill in skills_db:
            progress = db.query(models.UserSkillProgress).filter(
                models.UserSkillProgress.user_id == USER_ID,
                models.UserSkillProgress.skill_id == skill.id,
            ).first()

            skills_list.append({
                "id": skill.id,
                "title": skill.title,
                "icon": skill.icon,
                "order_index": skill.order_index,
                "status": progress.status if progress else "locked",
                "crowns_earned": progress.crowns_earned if progress else 0,
                "max_crowns": skill.max_crowns,
            })

        units_response.append({
            "id": unit.id,
            "title": unit.title,
            "skills": skills_list,
        })

    return {
        "user": {
            "xp_total": user.xp_total,
            "streak_count": user.streak_count,
            "hearts": user.hearts,
            "gems": user.gems,
            "daily_xp_goal": user.daily_xp_goal,
            "xp_today": get_xp_today(USER_ID, db),
            "next_heart_in_seconds": seconds_until_next_heart(user),
        },
        "units": units_response,
    }


@app.get("/api/skills/{skill_id}/lesson")
def get_lesson(skill_id: int, db: Session = Depends(get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.skill_id == skill_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found for this skill")

    exercises_db = db.query(models.Exercise).filter(
        models.Exercise.lesson_id == lesson.id
    ).order_by(models.Exercise.order_index).all()

    exercises_response = [
        {
            "id": ex.id,
            "type": ex.type,
            "prompt": ex.prompt,
            "data": ex.data,
        }
        for ex in exercises_db
    ]

    return {
        "lesson_id": lesson.id,
        "skill_id": skill_id,
        "exercises": exercises_response,
    }


@app.post("/api/lessons/{lesson_id}/answer")
def submit_answer(lesson_id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    apply_heart_regen(user, db)
    exercise_id = payload.get("exercise_id")
    user_answer = payload.get("answer")

    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if exercise.type == "match_pairs":
        left = user_answer.get("left")
        right = user_answer.get("right")
        correct_map = exercise.correct_answer.get("map", {})
        is_correct = correct_map.get(left) == right
    elif exercise.type == "type_answer":
        submitted = (user_answer.get("value") or "").strip().lower()
        accepted = exercise.correct_answer.get("accepted", [])
        is_correct = any(submitted == a.strip().lower() for a in accepted)
    else:
        is_correct = (user_answer == exercise.correct_answer)

    if not is_correct and user.hearts > 0:
        user.hearts -= 1
        if user.last_heart_lost_at is None:
            user.last_heart_lost_at = datetime.utcnow()
        db.commit()

    response = {
        "correct": is_correct,
        "hearts_remaining": user.hearts,
    }

    if exercise.type == "match_pairs":
        response["all_pairs_matched"] = False
    else:
        response["correct_answer"] = exercise.correct_answer

    return response


@app.post("/api/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    today = get_simulated_today()
    streak_incremented = apply_daily_streak(user, today)

    xp_earned = 15
    user.xp_total += xp_earned

    db.add(models.LessonAttempt(
        user_id=USER_ID,
        lesson_id=lesson_id,
        completed_at=datetime.utcnow(),
        xp_earned=xp_earned,
        hearts_lost=payload.get("hearts_lost", 0),
        passed=True,
    ))

    # Update (or create) this skill's progress row
    progress = db.query(models.UserSkillProgress).filter(
        models.UserSkillProgress.user_id == USER_ID,
        models.UserSkillProgress.skill_id == lesson.skill_id,
    ).first()

    skill = db.query(models.Skill).filter(models.Skill.id == lesson.skill_id).first()

    if not progress:
        progress = models.UserSkillProgress(
            user_id=USER_ID,
            skill_id=lesson.skill_id,
            crowns_earned=0,
            status="available",
        )
        db.add(progress)

    progress.crowns_earned = skill.max_crowns
    progress.status = "completed"
    progress.last_practiced_at = datetime.utcnow()

    # If this skill just became completed, unlock the next skill in the path
    # (ordered by unit.order_index, then skill.order_index — matches the
    # same ordering /api/path uses to render the winding path).
    if progress.status == "completed":
        all_skills = (
            db.query(models.Skill)
            .join(models.Unit, models.Skill.unit_id == models.Unit.id)
            .order_by(models.Unit.order_index, models.Skill.order_index)
            .all()
        )
        current_pos = next((i for i, s in enumerate(all_skills) if s.id == skill.id), None)

        if current_pos is not None and current_pos + 1 < len(all_skills):
            next_skill = all_skills[current_pos + 1]
            next_progress = db.query(models.UserSkillProgress).filter(
                models.UserSkillProgress.user_id == USER_ID,
                models.UserSkillProgress.skill_id == next_skill.id,
            ).first()

            if not next_progress:
                db.add(models.UserSkillProgress(
                    user_id=USER_ID,
                    skill_id=next_skill.id,
                    crowns_earned=0,
                    status="available",
                ))
            elif next_progress.status == "locked":
                next_progress.status = "available"

    db.commit()

    new_achievements_response = []
    century_club = db.query(models.Achievement).filter(models.Achievement.code == "xp_100").first()
    if century_club and user.xp_total >= 100:
        existing_xp_ach = db.query(models.UserAchievement).filter(
            models.UserAchievement.user_id == user.id,
            models.UserAchievement.achievement_id == century_club.id,
        ).first()
        if not existing_xp_ach:
            db.add(models.UserAchievement(user_id=user.id, achievement_id=century_club.id))
            db.commit()
            new_achievements_response.append({
                "code": century_club.code,
                "title": century_club.title,
                "icon": century_club.icon,
            })

    monthly_master = db.query(models.Achievement).filter(models.Achievement.code == "streak_30").first()
    if monthly_master and user.streak_count >= 30:
        existing_streak_ach = db.query(models.UserAchievement).filter(
            models.UserAchievement.user_id == user.id,
            models.UserAchievement.achievement_id == monthly_master.id,
        ).first()
        if not existing_streak_ach:
            db.add(models.UserAchievement(user_id=user.id, achievement_id=monthly_master.id))
            db.commit()
            new_achievements_response.append({
                "code": monthly_master.code,
                "title": monthly_master.title,
                "icon": monthly_master.icon,
            })

    return {
        "passed": True,
        "xp_earned": xp_earned,
        "new_xp_total": user.xp_total,
        "crowns_earned": progress.crowns_earned,
        "streak_count": user.streak_count,
        "streak_incremented": streak_incremented,
        "new_achievements": new_achievements_response,
    }


@app.get("/api/profile")
def get_profile(db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    apply_heart_regen(user, db)

    earned_records = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == USER_ID
    ).all()
    earned_ids = [r.achievement_id for r in earned_records]

    all_achievements = db.query(models.Achievement).all()
    earned_list = []
    locked_list = []

    for ach in all_achievements:
        ach_data = {"code": ach.code, "title": ach.title, "icon": ach.icon}
        if ach.id in earned_ids:
            record = next((r for r in earned_records if r.achievement_id == ach.id), None)
            ach_data["earned_at"] = record.earned_at.isoformat() + "Z" if record.earned_at else None
            earned_list.append(ach_data)
        else:
            locked_list.append(ach_data)

    return {
        "name": user.name,
        "xp_total": user.xp_total,
        "streak_count": user.streak_count,
        "hearts": user.hearts,
        "hearts_max": MAX_HEARTS,
        "next_heart_in_seconds": seconds_until_next_heart(user),
        "achievements": earned_list,
        "achievements_locked": locked_list,
    }


@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.xp_total.desc()).all()

    entries = [
        {"user_id": u.id, "name": u.name, "xp_total": u.xp_total, "rank": rank}
        for rank, u in enumerate(users, start=1)
    ]

    return {"current_user_id": USER_ID, "entries": entries}


def _collect_all_vocab_pairs(db: Session):
    """Pull every Spanish->English word pair seeded anywhere in the course,
    from every match_pairs exercise across every skill — not tied to any
    single lesson. This is what powers the Legendary challenge."""
    pairs = {}
    match_exercises = db.query(models.Exercise).filter(models.Exercise.type == "match_pairs").all()
    for ex in match_exercises:
        word_map = (ex.correct_answer or {}).get("map", {})
        for spanish, english in word_map.items():
            pairs[spanish] = english
    return pairs


@app.get("/api/legendary/challenge")
def get_legendary_challenge(db: Session = Depends(get_db)):
    all_pairs = _collect_all_vocab_pairs(db)
    if len(all_pairs) < 4:
        raise HTTPException(
            status_code=400,
            detail="Not enough seeded vocabulary yet for a Legendary challenge",
        )

    items = list(all_pairs.items())
    random.shuffle(items)
    round_count = min(8, len(items))
    chosen = items[:round_count]
    all_english = list(all_pairs.values())

    rounds = []
    for spanish, english in chosen:
        distractors = [w for w in all_english if w != english]
        random.shuffle(distractors)
        options = distractors[:3] + [english]
        random.shuffle(options)
        rounds.append({"target": spanish, "options": options})

    return {"rounds": rounds}


@app.post("/api/legendary/answer")
def check_legendary_answer(payload: dict, db: Session = Depends(get_db)):
    target = payload.get("target")
    answer = payload.get("answer")
    all_pairs = _collect_all_vocab_pairs(db)
    correct_answer = all_pairs.get(target)
    is_correct = answer == correct_answer
    return {"correct": is_correct, "correct_answer": correct_answer}


@app.post("/api/legendary/complete")
def complete_legendary(payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    correct_count = payload.get("correct_count", 0)
    total_rounds = payload.get("total_rounds", 1)
    is_perfect = correct_count == total_rounds and total_rounds > 0

    today = get_simulated_today()
    streak_incremented = apply_daily_streak(user, today)

    xp_earned = 30 if is_perfect else 0
    user.xp_total += xp_earned

    db.add(models.LessonAttempt(
        user_id=USER_ID,
        lesson_id=None,
        completed_at=datetime.utcnow(),
        xp_earned=xp_earned,
        hearts_lost=0,
        passed=is_perfect,
    ))
    db.commit()

    return {
        "passed": is_perfect,
        "xp_earned": xp_earned,
        "new_xp_total": user.xp_total,
        "streak_count": user.streak_count,
        "streak_incremented": streak_incremented,
    }


@app.post("/api/debug/advance-day")
def advance_day():
    global SIMULATED_DAY_OFFSET
    SIMULATED_DAY_OFFSET += 1
    simulated_date = get_simulated_today()
    return {"simulated_date": simulated_date.isoformat()}


@app.post("/api/settings/daily-goal")
def update_daily_goal(payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_goal = payload.get("daily_xp_goal")
    if not isinstance(new_goal, int) or new_goal <= 0:
        raise HTTPException(status_code=400, detail="daily_xp_goal must be a positive integer")

    user.daily_xp_goal = new_goal
    db.commit()
    return {"daily_xp_goal": user.daily_xp_goal}


@app.post("/api/hearts/refill")
def refill_hearts(db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hearts = 5
    db.commit()
    return {"hearts": user.hearts}