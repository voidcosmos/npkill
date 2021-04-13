document.addEventListener('DOMContentLoaded', () => {
  if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.querySelector('#theme-icon > img').src = 'img/sun.png';
  }
});

document.querySelector('#theme-icon').addEventListener('click', e => {
  document.body.classList.toggle('dark-theme');
  if(document.body.classList.contains('dark-theme')) {
    localStorage.setItem('theme', 'dark');
    e.target.src = 'img/sun.png';
  } else {
    localStorage.setItem('theme', 'light');
    e.target.src = 'img/moon.png';
  }
});
