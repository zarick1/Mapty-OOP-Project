'use strict';

let map, mapEvent;

class Workout {
  data = new Date();
  id = (Date.now() + '').slice(-10);
  marker;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

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

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

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

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];

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

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

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

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

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

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

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

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
//const run1 = new Running([39, -12], 5.2, 24, 178);
//console.log(app);
