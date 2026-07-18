from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    xp_total = Column(Integer, default=0)
    gems = Column(Integer, default=500)
    hearts = Column(Integer, default=5)
    last_heart_lost_at = Column(DateTime, nullable=True)
    streak_count = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    daily_xp_goal = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    language_code = Column(String)

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    order_index = Column(Integer)

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    title = Column(String)
    icon = Column(String)
    order_index = Column(Integer)
    max_crowns = Column(Integer, default=5)

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"))
    order_index = Column(Integer)

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    order_index = Column(Integer)
    type = Column(String) # multiple_choice, translate_tap, match_pairs, fill_blank, type_answer
    prompt = Column(String)
    data = Column(JSON)
    correct_answer = Column(JSON)

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    crowns_earned = Column(Integer, default=0)
    status = Column(String) # locked, available, completed
    last_practiced_at = Column(DateTime, nullable=True)

class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    xp_earned = Column(Integer, default=0)
    hearts_lost = Column(Integer, default=0)
    passed = Column(Boolean, default=False)

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    title = Column(String)
    description = Column(String)
    icon = Column(String)

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    earned_at = Column(DateTime, default=datetime.utcnow)