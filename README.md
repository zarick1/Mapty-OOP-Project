Mapty

Overview

Mapty is an interactive web application built with vanilla JavaScript, designed to track running and cycling workouts using a map interface. It leverages Leaflet.js for map rendering and local storage for persistent data. The application follows an Object-Oriented Programming (OOP) approach, utilizing classes and inheritance for a modular and maintainable codebase.

Features

Log Workouts: Record running or cycling workouts with details like distance, duration, cadence (running), or elevation gain (cycling).
Map Integration: Display workouts as markers on an interactive map using Leaflet.js, with popups showing workout details.
Dynamic Form: Input form adapts based on workout type, showing relevant fields (cadence for running, elevation for cycling).
Workout List: View a list of all workouts with key metrics (distance, duration, pace/speed).
Delete Workouts: Remove individual workouts from the map and list, updating local storage.
Persistent Data: Save workouts to local storage for access across sessions.
Responsive Design: Optimized for both desktop and mobile devices.

Technologies

JavaScript (ES6+): Core language with OOP principles (classes, inheritance) and async geolocation.
Leaflet.js: Library for rendering interactive maps.
HTML5 & CSS3: Structured content and responsive styling.
Local Storage: Persists workout data across sessions.

Project Structure

index.html: Main HTML file defining the structure of the application.
script.js: Core JavaScript logic, including workout classes (Workout, Running, Cycling) and app management (App).
style.css: Styles for the map, form, and workout list.

Usage

Allow geolocation access to load the map at your current location.
Click on the map to open the workout form.
Select the workout type (running or cycling), enter details (distance, duration, cadence/elevation), and submit.
View workouts as markers on the map and in the sidebar list.
Click a workout in the list to center the map on its location, or click the trash icon to delete it.
Use the reset method (accessible via console: app.reset()) to clear all workouts and reload the app.
