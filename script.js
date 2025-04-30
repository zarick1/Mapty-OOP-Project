'use strict';

let map, mapEvent;

/**
 * Base class for representing a workout (running or cycling).
 *
 * @class
 */
class Workout {
  data = new Date();
  id = (Date.now() + '').slice(-10);
  marker;

  /**
   * Creates a new workout instance.
   *
   * @param {Array<number>} coords The [latitude, longitude] coordinates of the workout.
   * @param {number} distance The distance of the workout in kilometers.
   * @param {number} duration The duration of the workout in minutes.
   */
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  /**
   * Sets a descriptive title for the workout based on its type and date.
   *
   * @private
   * @param {string} type The type of workout ('running' or 'cycling').
   * @this {Object} Workout instance
   */
  _setDescription(type) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.data.getMonth()]
    } ${this.data.getDate()}`;
  }
}

/**
 * Class representing a running workout, inheriting from Workout.
 *
 * @class
 * @extends Workout
 */
class Running extends Workout {
  type = 'running';

  /**
   * Creates a new running workout instance.
   *
   * @param {Array<number>} coords The [latitude, longitude] coordinates.
   * @param {number} distance The distance in kilometers.
   * @param {number} duration The duration in minutes.
   * @param {number} cadance The cadence in steps per minute.
   */
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calcPace();
    this._setDescription();
  }

  /**
   * Calculates the pace of the running workout (min/km).
   *
   * @returns {number} The pace in minutes per kilometer.
   * @this {Object} Running instance
   */
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

/**
 * Class representing a cycling workout, inheriting from Workout.
 *
 * @class
 * @extends Workout
 */
class Cycling extends Workout {
  type = 'cycling';

  /**
   * Creates a new cycling workout instance.
   *
   * @param {Array<number>} coords The [latitude, longitude] coordinates.
   * @param {number} distance The distance in kilometers.
   * @param {number} duration The duration in minutes.
   * @param {number} elevationGain The elevation gain in meters.
   */
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  /**
   * Calculates the speed of the cycling workout (km/h).
   *
   * @returns {number} The speed in kilometers per hour.
   * @this {Object} Cycling instance
   */
  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration / 60;
    return this.speed;
  }
}

// APLICATION ARHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/**
 * Main application class for managing workouts and map interactions.
 *
 * @class
 */
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];

  /**
   * Initializes the app by loading the user's position and setting up event listeners.
   *
   * @this {Object} App instance
   */
  constructor() {
    // Get users positions
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Clear form and display marker on submit
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Adjust form based on workout type
    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  /**
   * Retrieves the user's geolocation to initialize the map.
   *
   * @private
   * @this {Object} App instance
   */
  _getPosition() {
    // Find coordinates of current position and render map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  /**
   * Loads the Leaflet map at the user's geolocation.
   *
   * @private
   * @param {GeolocationPosition} position The user's geolocation data.
   * @this {Object} App instance
   */
  _loadMap(position) {
    // Get current location
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // Render map
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  /**
   * Displays the workout input form when the map is clicked.
   *
   * @private
   * @param {Object} mapE The Leaflet map click event.
   * @this {Object} App instance
   */
  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  /**
   * Hides the workout input form and clears input fields.
   *
   * @private
   * @this {Object} App instance
   */
  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  /**
   * Toggles visibility of cadence and elevation fields based on workout type.
   *
   * @private
   * @this {Object} App instance
   */
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  /**
   * Creates a new workout based on form input and renders it.
   *
   * @private
   * @param {Event} e The form submission event.
   * @this {Object} App instance
   */
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If activity running, create running obj
    if (type === 'running') {
      // Check if data is valid
      const cadance = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadance) ||
        !allPositive(distance, duration, cadance)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadance);
    }

    // if activity cycling, create cycling obj
    if (type === 'cycling') {
      // Check if data is valid
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs must be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new obj to workout array
    this.#workouts.push(workout);
    //console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fileds
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  /**
   * Renders a workout in the sidebar list.
   *
   * @private
   * @param {Workout} workout The workout object to render.
   * @this {Object} App instance
   */
  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}
          <button class="workout__delete-btn">🗑️</button>
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>

    `;

    if (workout.type === 'running') {
      html += `         
           <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `         
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  /**
   * Renders a marker on the Leaflet map for a workout.
   *
   * @private
   * @param {Workout} workout The workout object to mark.
   * @this {Object} App instance
   */
  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();

    console.log(marker);
    this.#markers.push(marker);
    //console.log(workout);
  }

  /**
   * Moves the map view to a workout's coordinates or deletes a workout when clicked.
   *
   * @private
   * @param {Event} e The click event on the workout list.
   * @this {Object} App instance
   */
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    // Delete section
    if (e.target.classList.contains('workout__delete-btn')) {
      const index = this.#workouts.findIndex(
        work => work.id === workoutEl.dataset.id
      );
      //console.log(index);
      if (index >= 0) {
        this.#workouts.splice(index, 1);
        this.#map.removeLayer(this.#markers[index]);
        this.#markers.splice(index, 1);
        this._setLocalStorage();
        workoutEl.remove();
      }
      return;
    }
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animation: true,
      pan: {
        duration: 1,
      },
    });
  }

  /**
   * Saves workouts to local storage.
   *
   * @private
   * @this {Object} App instance
   */
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  /**
   * Loads workouts from local storage and renders them.
   *
   * @private
   * @this {Object} App instance
   */
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    //console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  _deleteMarker(coords) {}

  /**
   * Resets the application by clearing local storage and reloading the page.
   *
   * @this {Object} App instance
   */
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
//const run1 = new Running([39, -12], 5.2, 24, 178);
//console.log(app);
