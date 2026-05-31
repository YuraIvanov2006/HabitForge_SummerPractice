from fastapi import FastAPI

app = FastAPI(
    title="HabitForge API",
    description="Персональний трекер звичок і продуктивності",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {"message": "Welcome to HabitForge API! Build the habit. Forge the future."}