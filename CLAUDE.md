# Description

This is a web based game written in HTML/JavaScript

This is a recreation of the [classic dinosaur endless running game in chrome](https://en.wikipedia.org/wiki/Dinosaur_Game). However, we are using NoCo Hacker's mascot instead of the dinosaur. The assets are laid out as follows

# Player Movements

The bunny doesn't actually move along the x axis, instead we simulate the x movement by having things move towards the bunny.

Run Animation: We cycle through this endlessly during gameplay except when acitvely jumping or crouching. The assets are: bun-run[0-3].png

Jump Animation: bun-jump[0-3].png, this is used when A) a mobile player presses the top half of the viewport or B) a PC player presses spacebar or the up arrow. The goal with jumping is to avoid hitting ground based obsticles. The player should be able to jump high enough to clear all ground based obsticles. The asset bun-jump0.png is briefly shown before the player leaves the ground, bun-jump1.png is used while rising and falling, bun-jump2.png is at the peak of the jump and bun-jump3.png is shown briefly when landing. More time should be spent showing bun-jump[12].png than bun-jump[03].png.

Crouch: bun-crouch0.png this is used when A) a mobile player presses the bottom half of the viewport or B) a PC player presses the down arrow. The goal with crouching is to avoid hitting air based obsticles. The player's hitbox should shrink when this is pressed (in order to match the visual size and to dodge air based obstcales. 

Idle Animation: This is used A) prior to the start of a game, before the user has pressed spacebar (or tapped the screen on mobile) to start the game B) after the game ends (until the user restarts by pressing spacebar or tapping the screen)

# Ground based obstacles

These move towards the user, but are not animated. laptop.png is the smallest of these, pc.png is medium and server.png is the largest. Initially we only use the laptop, but as the player's score increases we start to use the others more frequently. 

# Air based obstacles

These move towards the user and are also not animated. At present only one of these exists. drone.png

# Gameplay
1) User presses space or taps to start
2) The score increases continously until the player collides with an obstacle
3) The player jumps over ground based obstacles and dodges air based obstacles. 
4) When the game ends we display the score and tell the user to press space or tap to restart
