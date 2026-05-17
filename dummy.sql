CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100),
    password VARCHAR(100)
);

CREATE TABLE trainers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    username VARCHAR(50)
);

CREATE TABLE pokemon (
    id SERIAL PRIMARY KEY,
    trainer_id INT REFERENCES trainers(id),
    name VARCHAR(50),
    type VARCHAR(50)
);

CREATE TABLE moves (
    id SERIAL PRIMARY KEY,
    pokemon_id INT REFERENCES pokemon(id),
    move_name VARCHAR(50),
    damage INT
);