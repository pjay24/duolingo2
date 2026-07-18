from datetime import datetime
from app.database import engine, SessionLocal, Base
from app import models

# Create all tables
Base.metadata.create_all(bind=engine)


def seed_data(db=None):
    owns_session = db is None
    if db is None:
        db = SessionLocal()

    if db.query(models.User).first():
        print("Database already seeded. Skipping to avoid duplicates.")
        if owns_session:
            db.close()
        return False

    # 1. Create Default User (ID: 1) and Leaderboard Competitors
    default_user = models.User(name="Learner", xp_total=240, streak_count=5, hearts=4, gems=500)
    maria = models.User(name="Maria", xp_total=410, streak_count=12, hearts=5, gems=800)
    sam = models.User(name="Sam", xp_total=190, streak_count=2, hearts=3, gems=150)

    db.add_all([default_user, maria, sam])
    db.commit()

    # 2. Create Course
    course = models.Course(title="Spanish", language_code="es")
    db.add(course)
    db.commit()

    # 3. Create 2 Units
    unit1 = models.Unit(course_id=course.id, title="Unit 1: Basics", order_index=1)
    unit2 = models.Unit(course_id=course.id, title="Unit 2: Phrases", order_index=2)
    db.add_all([unit1, unit2])
    db.commit()

    # 4. Create 7 Skills
    skills = [
        models.Skill(unit_id=unit1.id, title="Greetings", icon="\U0001f44b", order_index=1, max_crowns=5),
        models.Skill(unit_id=unit1.id, title="Food", icon="\U0001f34e", order_index=2, max_crowns=5),
        models.Skill(unit_id=unit1.id, title="Animals", icon="\U0001f436", order_index=3, max_crowns=5),
        models.Skill(unit_id=unit1.id, title="Plurals", icon="\U0001f352", order_index=4, max_crowns=5),
        models.Skill(unit_id=unit2.id, title="Travel", icon="\U00002708", order_index=1, max_crowns=5),
        models.Skill(unit_id=unit2.id, title="Family", icon="\U0001f46a", order_index=2, max_crowns=5),
        models.Skill(unit_id=unit2.id, title="Numbers", icon="\U0001f522", order_index=3, max_crowns=5),
    ]
    db.add_all(skills)
    db.commit()

    # Add Progress for User 1 (Completed Greetings, Available Food, Locked others)
    db.add(models.UserSkillProgress(user_id=1, skill_id=skills[0].id, crowns_earned=5, status="completed"))
    db.add(models.UserSkillProgress(user_id=1, skill_id=skills[1].id, crowns_earned=0, status="available"))
    for s in skills[2:]:
        db.add(models.UserSkillProgress(user_id=1, skill_id=s.id, crowns_earned=0, status="locked"))
    db.commit()

    # 5. Create 1 Lesson per Skill
    lessons = [models.Lesson(skill_id=s.id, order_index=1) for s in skills]
    db.add_all(lessons)
    db.commit()

    # 6. Create exactly 5 exercises per skill (35 total), covering all 5 exercise types
    exercises = [
        # Lesson 1 (Greetings) - 5 exercises
        models.Exercise(lesson_id=lessons[0].id, order_index=1, type="multiple_choice", prompt="Select the correct translation for 'Hello'", data={"options": ["Hola", "Adiós", "Gracias", "Por favor"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[0].id, order_index=2, type="translate_tap", prompt="Translate 'Good morning'", data={"word_bank": ["Buenos", "días", "noches", "Hola"]}, correct_answer={"sequence": ["Buenos", "días"]}),
        models.Exercise(lesson_id=lessons[0].id, order_index=3, type="match_pairs", prompt="Match the greetings", data={"pairs": [{"left": "Hola", "right": "Hello"}, {"left": "Adiós", "right": "Goodbye"}]}, correct_answer={"map": {"Hola": "Hello", "Adiós": "Goodbye"}}),
        models.Exercise(lesson_id=lessons[0].id, order_index=4, type="type_answer", prompt="Translate to Spanish", data={"prompt_translation_hint": "Type in Spanish: Please"}, correct_answer={"accepted": ["Por favor", "por favor"]}),
        models.Exercise(lesson_id=lessons[0].id, order_index=5, type="fill_blank", prompt="Fill in the blank", data={"sentence": "___ tardes.", "options": ["Buenas", "Bueno", "Buenos"]}, correct_answer={"value": "Buenas"}),

        # Lesson 2 (Food) - 5 exercises
        models.Exercise(lesson_id=lessons[1].id, order_index=1, type="fill_blank", prompt="Fill in the blank", data={"sentence": "Yo ___ una manzana.", "options": ["como", "comes", "comen"]}, correct_answer={"value": "como"}),
        models.Exercise(lesson_id=lessons[1].id, order_index=2, type="multiple_choice", prompt="Select 'Apple'", data={"options": ["La manzana", "El pan", "La leche", "El agua"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[1].id, order_index=3, type="translate_tap", prompt="Translate 'I drink water'", data={"word_bank": ["Yo", "bebo", "como", "agua", "leche"]}, correct_answer={"sequence": ["Yo", "bebo", "agua"]}),
        models.Exercise(lesson_id=lessons[1].id, order_index=4, type="match_pairs", prompt="Match the food words", data={"pairs": [{"left": "El pan", "right": "Bread"}, {"left": "La leche", "right": "Milk"}]}, correct_answer={"map": {"El pan": "Bread", "La leche": "Milk"}}),
        models.Exercise(lesson_id=lessons[1].id, order_index=5, type="type_answer", prompt="Translate 'The water'", data={"prompt_translation_hint": "Type in Spanish: The water"}, correct_answer={"accepted": ["El agua", "el agua"]}),

        # Lesson 3 (Animals) - 5 exercises
        models.Exercise(lesson_id=lessons[2].id, order_index=1, type="match_pairs", prompt="Match the animals", data={"pairs": [{"left": "El perro", "right": "The dog"}, {"left": "El gato", "right": "The cat"}]}, correct_answer={"map": {"El perro": "The dog", "El gato": "The cat"}}),
        models.Exercise(lesson_id=lessons[2].id, order_index=2, type="type_answer", prompt="Translate 'The dog'", data={"prompt_translation_hint": "Type in Spanish: The dog"}, correct_answer={"accepted": ["El perro", "el perro"]}),
        models.Exercise(lesson_id=lessons[2].id, order_index=3, type="fill_blank", prompt="Fill in the blank", data={"sentence": "El gato ___ leche.", "options": ["bebe", "bebo", "bebes"]}, correct_answer={"value": "bebe"}),
        models.Exercise(lesson_id=lessons[2].id, order_index=4, type="multiple_choice", prompt="Select 'The bird'", data={"options": ["El pájaro", "El pez", "El caballo", "El ratón"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[2].id, order_index=5, type="translate_tap", prompt="Translate 'The cat runs'", data={"word_bank": ["El", "gato", "corre", "come", "duerme"]}, correct_answer={"sequence": ["El", "gato", "corre"]}),

        # Lesson 4 (Plurals) - 5 exercises
        models.Exercise(lesson_id=lessons[3].id, order_index=1, type="multiple_choice", prompt="Select 'The apples'", data={"options": ["Las manzanas", "La manzana", "Los perros", "El pan"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[3].id, order_index=2, type="translate_tap", prompt="Translate 'We eat apples'", data={"word_bank": ["Nosotros", "comemos", "manzanas", "agua", "beben"]}, correct_answer={"sequence": ["Nosotros", "comemos", "manzanas"]}),
        models.Exercise(lesson_id=lessons[3].id, order_index=3, type="fill_blank", prompt="Fill in the blank", data={"sentence": "Los ___ corren.", "options": ["perros", "perro", "perra"]}, correct_answer={"value": "perros"}),
        models.Exercise(lesson_id=lessons[3].id, order_index=4, type="match_pairs", prompt="Match singular to plural", data={"pairs": [{"left": "El gato", "right": "Los gatos"}, {"left": "La casa", "right": "Las casas"}]}, correct_answer={"map": {"El gato": "Los gatos", "La casa": "Las casas"}}),
        models.Exercise(lesson_id=lessons[3].id, order_index=5, type="type_answer", prompt="Translate 'The houses'", data={"prompt_translation_hint": "Type in Spanish: The houses"}, correct_answer={"accepted": ["Las casas", "las casas"]}),

        # Lesson 5 (Travel) - 5 exercises
        models.Exercise(lesson_id=lessons[4].id, order_index=1, type="fill_blank", prompt="Fill in the blank", data={"sentence": "Yo necesito un ___.", "options": ["pasaporte", "maleta", "boleto"]}, correct_answer={"value": "pasaporte"}),
        models.Exercise(lesson_id=lessons[4].id, order_index=2, type="match_pairs", prompt="Match the travel words", data={"pairs": [{"left": "El boleto", "right": "The ticket"}, {"left": "La maleta", "right": "The suitcase"}]}, correct_answer={"map": {"El boleto": "The ticket", "La maleta": "The suitcase"}}),
        models.Exercise(lesson_id=lessons[4].id, order_index=3, type="multiple_choice", prompt="Select 'The suitcase'", data={"options": ["El pasaporte", "La maleta", "El boleto", "El taxi"]}, correct_answer={"index": 1}),
        models.Exercise(lesson_id=lessons[4].id, order_index=4, type="translate_tap", prompt="Translate 'I need a taxi'", data={"word_bank": ["Yo", "necesito", "un", "taxi", "boleto"]}, correct_answer={"sequence": ["Yo", "necesito", "un", "taxi"]}),
        models.Exercise(lesson_id=lessons[4].id, order_index=5, type="type_answer", prompt="Translate 'The airport'", data={"prompt_translation_hint": "Type in Spanish: The airport"}, correct_answer={"accepted": ["El aeropuerto", "el aeropuerto"]}),

        # Lesson 6 (Family) - 5 exercises
        models.Exercise(lesson_id=lessons[5].id, order_index=1, type="translate_tap", prompt="Translate 'My mother'", data={"word_bank": ["Mi", "madre", "padre", "hermano"]}, correct_answer={"sequence": ["Mi", "madre"]}),
        models.Exercise(lesson_id=lessons[5].id, order_index=2, type="type_answer", prompt="Translate 'My father'", data={"prompt_translation_hint": "Type in Spanish: My father"}, correct_answer={"accepted": ["Mi padre", "mi padre"]}),
        models.Exercise(lesson_id=lessons[5].id, order_index=3, type="multiple_choice", prompt="Select 'Sister'", data={"options": ["Hermana", "Hermano", "Madre", "Padre"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[5].id, order_index=4, type="fill_blank", prompt="Fill in the blank", data={"sentence": "Mi ___ se llama Ana.", "options": ["hermana", "hermano", "padre"]}, correct_answer={"value": "hermana"}),
        models.Exercise(lesson_id=lessons[5].id, order_index=5, type="match_pairs", prompt="Match the family words", data={"pairs": [{"left": "Hermano", "right": "Brother"}, {"left": "Abuela", "right": "Grandmother"}]}, correct_answer={"map": {"Hermano": "Brother", "Abuela": "Grandmother"}}),

        # Lesson 7 (Numbers) - 5 exercises
        models.Exercise(lesson_id=lessons[6].id, order_index=1, type="multiple_choice", prompt="Select 'One'", data={"options": ["Uno", "Dos", "Tres", "Cuatro"]}, correct_answer={"index": 0}),
        models.Exercise(lesson_id=lessons[6].id, order_index=2, type="match_pairs", prompt="Match the numbers", data={"pairs": [{"left": "Dos", "right": "Two"}, {"left": "Tres", "right": "Three"}, {"left": "Cuatro", "right": "Four"}]}, correct_answer={"map": {"Dos": "Two", "Tres": "Three", "Cuatro": "Four"}}),
        models.Exercise(lesson_id=lessons[6].id, order_index=3, type="fill_blank", prompt="Fill in the blank", data={"sentence": "Tengo ___ años.", "options": ["cinco", "cinco años", "cinca"]}, correct_answer={"value": "cinco"}),
        models.Exercise(lesson_id=lessons[6].id, order_index=4, type="translate_tap", prompt="Translate 'I have six apples'", data={"word_bank": ["Yo", "tengo", "seis", "manzanas", "cinco"]}, correct_answer={"sequence": ["Yo", "tengo", "seis", "manzanas"]}),
        models.Exercise(lesson_id=lessons[6].id, order_index=5, type="type_answer", prompt="Translate 'Ten'", data={"prompt_translation_hint": "Type in Spanish: Ten"}, correct_answer={"accepted": ["Diez", "diez"]}),
    ]
    db.add_all(exercises)
    db.commit()

    # 7. Create Achievements
    ach1 = models.Achievement(code="xp_100", title="Century Club", description="Earn 100 XP", icon="\U0001f3c5")
    ach2 = models.Achievement(code="streak_30", title="Monthly Master", description="30 day streak", icon="\U0001f525")
    db.add_all([ach1, ach2])
    db.commit()

    # Link the 100 XP achievement to the default user to maintain logical consistency
    earned_ach = models.UserAchievement(user_id=1, achievement_id=ach1.id, earned_at=datetime.utcnow())
    db.add(earned_ach)
    db.commit()

    print("Database seeded successfully with all units, skills, 35 exercises, users, and achievements!")

    if owns_session:
        db.close()
    return True


if __name__ == "__main__":
    seed_data()