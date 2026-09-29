from datetime import datetime


def greet(name):
    return f"Привет, {name}! Добро пожаловать в мир Python."


print("Hello, World!")

name = input("Как тебя зовут? ")
print(greet(name))

now = datetime.now()
print(f"Сейчас {now:%H:%M}, дата {now:%d.%m.%Y}.")
