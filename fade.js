function onloadFade() {
    if ('ontouchstart' in document.documentElement) {
        initFadeTimeout();
    }
}

function fadeOut() {
    document.getElementById('black-div').classList.remove('fade-in');
    document.getElementById('black-div').classList.add('fade-out');
}

function fadeIn() {
    document.getElementById('black-div').classList.remove('fade-out');
    document.getElementById('black-div').classList.add('fade-in');
}

function initFadeTimeout() {
    var delayBeforeFade = 10 * 1000;
    setTimeout(fadeOut, delayBeforeFade);
    window.addEventListener('touchstart', function() {
        fadeIn();
        setTimeout(fadeOut, delayBeforeFade);
    });
}
