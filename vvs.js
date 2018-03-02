/* Each entry contains an array. The array must be structured like this:
 *   [id, destination array, ignore array]
 *
 * The 'id' is the station's id you want to appear on the monitor.
 *
 * The 'destination array' is an array with the direction names. Note that
 * each lines can have multiple destination (e. g. at nights). The monitor
 * will log errors for all destination which are not included in the array.
 * This is done to allow noticing configuration errors.
 *
 * If you are sure that you don't want to include a destination included
 * the name in the 'ignore array'. Note that [''] means that all stations
 * are ignored.
*/
var stations = [
            // Engelboldstraße
            ['5000008', ['Vaihingen', 'Vaihingen Bf'], ['']],
            // Kaltental
            ['5006009', ['Mineralbäder', 'Fellbach', 'Fellbach Lutherkirche', 'Heslach Vogelrain', 'Heslach'], ['Vaihingen', 'Vaihingen Bf', '- Betriebsfahrt -']],
            // Im Elsental
            ['5002578', ['Rohr Mitte', 'Leinfelden'], ['']],
            // Österfeld
            ['5006027', [''], ['']]
];

/*
 * Miliseconds to wait before the screen start to fade.
 */
var delayBeforeFade = 30 * 1000;

function init() {
    if ('ontouchstart' in document.documentElement) {
        addTouchListener();
    }
    addAllStations()
    updateStations(true);
    updateClock();
}

function addAllStations() {
    for (var index = 0; index < stations.length; index++) {
      var stationDiv = document.createElement('div');
      stationDiv.id = stations[index][0];
      stationDiv.classList.add('station');
      var stationNameDiv = document.createElement('div');
      stationNameDiv.classList.add('stationName');
      stationNameDiv.id = "stationName" + stations[index][0];
      stationDiv.appendChild(stationNameDiv);
      var connectionsDiv = document.createElement('div');
      connectionsDiv.id = "connections" + stations[index][0];
      connectionsDiv.classList.add('connections');
      stationDiv.appendChild(connectionsDiv);
      document.getElementById('stations').appendChild(stationDiv);
    }
}

function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
    setTimeout(function() {updateClock();}, 1 * 1000);
}

function updateTimeToUpdate(time) {
    setTimeout(function() {
        time = time - 1000;
        if (0 <= time) {
            setUpdateTimeToUpdateText(time);
            updateTimeToUpdate(time);
        }
    }, 1000);
}

function setUpdateTimeToUpdateText(time) {
        var text = 'Aktualisiere...';
        if (!document.getElementById('next-update-icon').classList.contains('spin')) {
            text = "Aktualisierung in " + time / 1000 + " s";
        }
        document.getElementById('next-update').innerText = text;
}

function updateStations(withTimeout) {
    if (withTimeout) {
        var time = 120 * 1000;
        setTimeout(function() {updateStations(true);}, time);
        updateTimeToUpdate(time);
    }
    for (var index = 0; index < stations.length; index++) {
        updateStation(stations[index][0], stations[index][1], stations[index][2]);
    }
    document.getElementById('next-update-icon').classList.add('spin');
    setUpdateTimeToUpdateText(0);
    setTimeout(function() {
        document.getElementById('next-update-icon').classList.remove('spin');
    }, 1000);
}

function updateStation(stationId, directions, ignoreDirections) {
    var vvsRequest = new XMLHttpRequest();
    vvsRequest.open("GET", "https://efa-api.asw.io/api/v1/station/" + stationId + "/departures/", true);
    vvsRequest.setRequestHeader("Content-type","application/json");
    vvsRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            addConnections(stationId, directions, ignoreDirections, this.responseText);
        }
    }
    vvsRequest.send();
}

function addConnections(stationId, directions, ignoreDirections, connections) {
    var stationDiv = document.getElementById("stationName" + stationId);
    var connectionsDiv = document.getElementById('connections' + stationId);
    while (connectionsDiv.firstChild) {
        connectionsDiv.removeChild(connectionsDiv.firstChild);
    }
    var numberOfStationsAdded = 0;
    for (var i = 0; i < 10000; i++) {
        var connection = JSON.parse(connections)[i];
        stationDiv.innerText = connection['stopName'];
        if (!arrayContains(connection['direction'], directions) ) {
            if (!arrayContains(connection['direction'], ignoreDirections)) {
                console.log('Connection excluded', connection['direction'], directions);
                var debugging = document.getElementById('debugging');
                debugging.innerText = "Folgende Verbindungen wurden nicht berücksichtigt (Fehler!):";
                var debuggingUl = document.getElementById('debuggingUl');
                console.log(debuggingUl);
                var p = document.createElement("li");
                p.innerText = "Von " + connection['stopName'] + " nach " + connection['direction'] + ". Erlaubte Ziele: " + directions;
                debuggingUl.appendChild(p);
            }
            continue;
        }
        var connectionDiv = document.createElement('div');
        connectionDiv.classList.add('connection');

        var timeSpan = document.createElement("span");
        timeSpan.classList.add('time-span');
        connectionDiv.appendChild(timeSpan);
        timeSpan.appendChild(getTime(connection));
        timeSpan.appendChild(getDelay(connection));
        connectionDiv.appendChild(addDirection(connection));
        connectionsDiv.appendChild(connectionDiv);
        numberOfStationsAdded++;
        if (numberOfStationsAdded === 4) {
            break;
        }
    }
}

function getTime(connection) {
    var connectionP = document.createElement("span");
    var hour = connection['departureTime']['hour'];
    if (hour < 10) {
        hour = "0" + hour;
    }
    var minutes = connection['departureTime']['minute'];
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    connectionP.innerText = hour + ":" + minutes;
    return connectionP;
}

function getDelay(connection) {
    var delaySpan = document.createElement("span");
    var delay = connection['delay'];
    if (parseInt(delay) != 0) {
        delaySpan.classList.add('delay');
        delaySpan.innerText = " +" + delay;
    }
    return delaySpan;
}

function addDirection(connection) {
    var root = document.createElement("span");
    var arrowP = document.createElement("span");
    var image = document.createElement('img');
    var directionP  = document.createElement("span");
    root.appendChild(arrowP);
    root.appendChild(image);
    root.appendChild(directionP);

    var number_ = connection['number'];
    if (number_.startsWith('S')) {
        image.src = 'https://www.vvs.de/typo3conf/ext/vvs_efa_monitor/Resources/Public/Images/icon.sbahn.20.png';
    } else if (number_.startsWith('U')) {
        image.src = 'https://www.vvs.de/typo3conf/ext/vvs_efa_monitor/Resources/Public/Images/icon.ubahn.20.png'
    } else {
        image.src = 'https://www.vvs.de/typo3conf/ext/vvs_efa_monitor/Resources/Public/Images/icon.bus.20.png';
    }
    arrowP.innerText = " → ";
    directionP.innerText = " " + number_ + ": " + connection['direction'];
    return root;
}

function fadeOut() {
    document.getElementById('black-div').classList.add('fade-out');
    document.getElementById('copyright').style.zIndex = -1;
}

function fadeIn() {
    document.getElementById('black-div').classList.remove('fade-out');
    document.getElementById('copyright').style.zIndex = 0;
}

function addTouchListener() {
    var timeout = setTimeout(fadeOut, delayBeforeFade);
    window.addEventListener('touchstart', function() {
        clearTimeout(timeout);
        updateStations(false);
        fadeIn();
        timeout = setTimeout(fadeOut, delayBeforeFade);
    });
}

function arrayContains(needle, arraystack) {
    if (arraystack.indexOf('') != -1) {
        return true;
    }
    return (arraystack.indexOf(needle) > -1);
}
