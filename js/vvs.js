/*
 * Each entry contains an array. The array must be structured like this:
 *
 *   [id, destination array, ignore array]
 *
 * The 'id' is the station's id you want to appear on the monitor.
 *
 * The 'destination array' is an array with the direction names.
 * All names given in this list, will be displayed. '' means, that all
 * directions of all lines will be displayed.  Note that a line can have
 * multiple destination (e. g. at nights). The monitor will log errors
 * for all destination which are not included in the array. This is done
 * to allow noticing configuration errors.
 *
 * If you are sure that you don't want to include a destination included
 * the name in the 'ignore array'. Note that [''] means that all stations
 * are ignored.
 *
 * Example:
 *
 *      ['5000008', ['Vaihingen', 'Vaihingen Bf'], ['']],
 *
 * Display only the lines with direction 'Vahingen' and 'Vaihingen Bf'. Ignore
 * all other destinations (indicated by '').
 *
 * An other example:
 *
 *      ['5006009', ['Mineralbäder', 'Fellbach', 'Heslach Vogelrain'], ['Vaihingen', 'Vaihingen Bf']],
 *
 * Display everything which has the direction 'Mineralbäder', 'Fellbach'
 * and 'Helsach Vogelrain'. All connections to 'Vaihingen', 'Vaihingen Bf'
 * are ignored. The connection to 'Fellbach Lutherkirche' will appear in
 * the debug section, because it is not incldue of none of the arrays.
 *
*/
var stations = [
    // Engelboldstraße
    ['5000008', ['Vaihingen', 'Vaihingen Bf'], ['']],
    // Kaltental
    ['5006009', ['Mineralbäder', 'Fellbach', 'Fellbach Lutherkirche', 'Heslach Vogelrain', 'Heslach'], ['Vaihingen', 'Vaihingen Bf', '- Betriebsfahrt -']],
    // Im Elsental
    ['5002578', ['Rohr Mitte', 'Leinfelden'], ['']],
    // Österfeld
    ['5006027', [''], []],
    // Reichenbach (F)
    ['5004224', [''], []],
];

/*
 * Seconds to wait before the screen start to fade.
 */
var delayBeforeFade = 10;

/*
 * Updates all stations/connnections all x seconds
 */
var updateAll = 60;

var updateTimeout = null;

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
      stationDiv.classList.add('col-sm-6');
      var stationNameDiv = document.createElement('div');
      stationNameDiv.classList.add('font-weight-bold');
      stationNameDiv.classList.add('h5');
      stationNameDiv.classList.add('bg-primary');
      stationNameDiv.classList.add('rounded');
      stationNameDiv.classList.add('p-1');
      stationNameDiv.classList.add('pl-2');
      stationNameDiv.classList.add('mt-2');
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
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(function() {
        time = time - 1000;
        if (0 <= time) {
            setUpdateTimeToUpdateText(time);
            updateTimeToUpdate(time);
        }
    }, 1000);
}

function setUpdateTimeToUpdateText(time) {
        var text = "Aktualisierung in " + time / 1000 + " s";
        if (time === 0) {
            document.getElementById('next-update-icon').classList.remove('invisible');
            text = 'Aktualisiere...';
        } else {
            document.getElementById('next-update-icon').classList.add('invisible');
        }
        document.getElementById('next-update').innerText = text;
}

function updateStations(withTimeout) {
    if (withTimeout) {
        var time = updateAll * 1000;
        setTimeout(function() {updateStations(true);}, time);
        updateTimeToUpdate(time);
    }
    for (var index = 0; index < stations.length; index++) {
        updateStation(stations[index][0], stations[index][1], stations[index][2]);
    }
    setUpdateTimeToUpdateText(0);
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
        stationDiv.innerText = "ab '" + connection['stopName'] + "'";
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

        var timeSpan = document.createElement("span");
        timeSpan.classList.add('time-span');
        timeSpan.classList.add('pl-2');
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
        delaySpan.classList.add('text-danger');
        delaySpan.classList.add('font-weight-bold');
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
        image.src = 'https://www.ssb-ag.de/typo3conf/ext/mq_efa_ssb/Resources/Public/Icons/sbahn.svg';
    } else if (number_.startsWith('U')) {
        image.src = 'https://www.ssb-ag.de/typo3conf/ext/mq_efa_ssb/Resources/Public/Icons/ubahn.svg';
    // is R ever returned?
    } else if (number_.startsWith('R')) {
        image.src = 'https://www.ssb-ag.de/typo3conf/ext/mq_efa_ssb/Resources/Public/Icons/rbahn.svg';
    } else {
        image.src = 'https://www.ssb-ag.de/typo3conf/ext/mq_efa_ssb/Resources/Public/Icons/bus.svg';
    }
    image.style.height = '20px';
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
    var timeout = setTimeout(fadeOut, delayBeforeFade * 1000);
    window.addEventListener('touchstart', function() {
        clearTimeout(timeout);
        updateStations(false);
        fadeIn();
        timeout = setTimeout(fadeOut, delayBeforeFade * 1000);
    });
}

function arrayContains(needle, arraystack) {
    if (arraystack.indexOf('') != -1) {
        return true;
    }
    return (arraystack.indexOf(needle) > -1);
}
