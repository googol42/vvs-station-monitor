function onloadFade() {
    if ('ontouchstart' in document.documentElement) {
        initFadeTimeout();
    }
}

function fadeOut() {
    document.getElementById('black-div').classList.remove('fade-in');
    document.getElementById('black-div').classList.add('fade-out');
    document.getElementById('copyright').style.zIndex = -1;
}

function fadeIn() {
    document.getElementById('black-div').classList.remove('fade-out');
    document.getElementById('black-div').classList.add('fade-in');
    document.getElementById('copyright').style.zIndex = 0;
}

function initFadeTimeout() {
    var delayBeforeFade = 15 * 1000;
    setTimeout(fadeOut, delayBeforeFade);
    window.addEventListener('touchstart', function() {
        fadeIn();
        setTimeout(fadeOut, delayBeforeFade);
    });
}
