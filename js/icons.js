const ICON_DAY = '#0088FF';
const ICON_NIGHT = '#FF7700';

function iconColor() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' ? ICON_DAY : ICON_NIGHT;
}

function iconStar(color) {
  const c = color || iconColor();
  return '<svg viewBox="0 0 15 14" width="15" height="14" style="display:inline;vertical-align:-2px">' +
    '<path fill="' + c + '" fill-rule="evenodd" d="M7.503,0C7.72,0 7.912,0.14 7.979,0.346L9.492,5.001H14.504C14.724,5.001 14.917,5.144 14.983,5.354C15.047,5.563 14.968,5.791 14.787,5.915L10.724,8.702L12.291,13.344C12.36,13.55 12.288,13.778 12.113,13.907C11.937,14.036 11.698,14.037 11.522,13.909L7.503,10.997L3.483,13.909C3.307,14.037 3.068,14.036 2.892,13.907C2.717,13.778 2.645,13.55 2.714,13.344L4.281,8.702L0.218,5.915C0.037,5.791 -0.043,5.563 0.022,5.354C0.087,5.144 0.281,5.001 0.501,5.001H5.513L7.026,0.346C7.093,0.14 7.286,0 7.503,0Z"/>' +
    '</svg>';
}

function iconHeartFull(color) {
  const c = color || iconColor();
  return '<svg viewBox="0 0 13 12" width="13" height="12" style="display:inline;vertical-align:-1px">' +
    '<path fill="' + c + '" d="M6.502,12.003C6.301,12.002 6.105,11.942 5.939,11.828C3.483,10.161 2.419,9.018 1.832,8.303C0.582,6.779 -0.017,5.215 0,3.52C0.02,1.579 1.578,0 3.472,0C4.85,0 5.804,0.776 6.36,1.423C6.378,1.443 6.4,1.459 6.424,1.47C6.448,1.481 6.475,1.487 6.502,1.487C6.529,1.487 6.555,1.481 6.58,1.47C6.604,1.459 6.626,1.443 6.643,1.423C7.199,0.775 8.153,0 9.531,0C11.426,0 12.983,1.579 13.003,3.521C13.02,5.215 12.421,6.78 11.171,8.303C10.585,9.018 9.521,10.161 7.064,11.829C6.899,11.942 6.702,12.002 6.502,12.003Z"/>' +
    '</svg>';
}

function iconHeartEmpty(color) {
  const c = color || iconColor();
  return '<svg viewBox="0 0 14 13" width="14" height="13" style="display:inline;vertical-align:-1px">' +
    '<path fill="none" stroke="' + c + '" stroke-width="1.2" fill-rule="evenodd" d="M0,3.57C0.02,1.643 1.551,0 3.522,0C4.732,0 5.62,0.599 6.185,1.16C6.325,1.298 6.447,1.437 6.552,1.566C6.656,1.437 6.778,1.298 6.918,1.16C7.483,0.599 8.372,0 9.581,0C11.552,0 13.083,1.643 13.103,3.57L13.103,3.57C13.14,7.309 10.136,9.888 7.142,11.921C6.968,12.039 6.762,12.102 6.552,12.102C6.341,12.102 6.135,12.039 5.961,11.921C2.967,9.888 -0.037,7.309 0,3.57L0,3.57Z"/>' +
    '</svg>';
}

function iconArrowBack(color) {
  const c = color || iconColor();
  return '<svg viewBox="0 0 24 24" width="24" height="24" style="display:inline;vertical-align:-4px">' +
    '<path fill="' + c + '" d="M20,11H7.83l5.59,-5.59L12,4l-8,8 8,8 1.41,-1.41L7.83,13H20v-2z"/>' +
    '</svg>';
}

function iconMedalGold() {
  return '<svg viewBox="0 0 24 24" width="24" height="24" style="display:inline;vertical-align:-4px">' +
    '<path fill="#FFD700" d="M12,2C8.13,2 5,5.13 5,9c0,2.38 1.19,4.47 3,5.74V17c0,0.55 0.45,1 1,1h6c0.55,0 1,-0.45 1,-1v-2.26c1.81,-1.27 3,-3.36 3,-5.74C19,5.13 15.87,2 12,2zM12,4c2.76,0 5,2.24 5,5s-2.24,5 -5,5s-5,-2.24 -5,-5S9.24,4 12,4z"/>' +
    '</svg>';
}

function iconMedalSilver() {
  return '<svg viewBox="0 0 24 24" width="24" height="24" style="display:inline;vertical-align:-4px">' +
    '<path fill="#C0C0C0" d="M12,2C8.13,2 5,5.13 5,9c0,2.38 1.19,4.47 3,5.74V17c0,0.55 0.45,1 1,1h6c0.55,0 1,-0.45 1,-1v-2.26c1.81,-1.27 3,-3.36 3,-5.74C19,5.13 15.87,2 12,2zM12,4c2.76,0 5,2.24 5,5s-2.24,5 -5,5s-5,-2.24 -5,-5S9.24,4 12,4z"/>' +
    '</svg>';
}

function iconMedalBronze() {
  return '<svg viewBox="0 0 24 24" width="24" height="24" style="display:inline;vertical-align:-4px">' +
    '<path fill="#CD7F32" d="M12,2C8.13,2 5,5.13 5,9c0,2.38 1.19,4.47 3,5.74V17c0,0.55 0.45,1 1,1h6c0.55,0 1,-0.45 1,-1v-2.26c1.81,-1.27 3,-3.36 3,-5.74C19,5.13 15.87,2 12,2zM12,4c2.76,0 5,2.24 5,5s-2.24,5 -5,5s-5,-2.24 -5,-5S9.24,4 12,4z"/>' +
    '</svg>';
}
