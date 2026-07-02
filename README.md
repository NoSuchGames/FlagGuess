# FlagGuess

[![GitHub Pages](https://img.shields.io/badge/live%20demo-GitHub%20Pages-2f855a?logo=githubpages&logoColor=white)](https://nosuchgames.github.io/FlagGuess/)
[![Source](https://img.shields.io/badge/source-GitHub-181717?logo=github&logoColor=white)](https://github.com/NoSuchGames/FlagGuess)
[![License](https://img.shields.io/badge/license-GPL--3.0-111827?logo=gnu&logoColor=white)](LICENSE)

FlagGuess is a browser-based flag quiz for 1-8 teams. Each round, a team picks a difficulty, reveals tiles on a hidden flag, and tries to guess the country with as few hints as possible.

## How it works

- The game uses a 6x4 tile grid over each flag.
- Teams take turns in order.
- A round starts by choosing a difficulty: Easy, Medium, Hard, or Expert.
- Revealing tiles reduces the round's potential score.
- Each round allows one guess.
- A correct guess awards the remaining points for that difficulty.
- A wrong guess or giving up applies the full difficulty penalty to the current team.

## Scoring

- Easy: 10 base points, minus 1 point per revealed tile
- Medium: 20 base points, minus 2 points per revealed tile
- Hard: 30 base points, minus 3 points per revealed tile
- Expert: 50 base points, minus 5 points per revealed tile

## Gameplay

1. Pick the number of teams.
2. Edit the team names if desired.
3. Start the game.
4. Choose a difficulty.
5. Reveal one tile at a time or reveal all.
6. Type a country name and submit your guess.
7. Move to the next turn when the round ends.

## Project structure

- [index.html](index.html): main game page
- [src/main.js](src/main.js): game logic, scoring, round flow, and UI updates
- [src/mapping.js](src/mapping.js): country list, difficulty mapping, and flag image URLs
- [src/main.css](src/main.css): styling for the interface
- [flags/](flags/): flag SVG assets

## Running locally

This is a static front-end project. Open [index.html](index.html) in a browser, or serve the folder with any simple static file server if you prefer.

## Notes

- Flag difficulty is assigned from the country mapping in [src/mapping.js](src/mapping.js).
- The autocomplete list searches country names as you type.
- The current game state is kept entirely in the browser.

### 