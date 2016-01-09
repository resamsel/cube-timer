var clientId = '638606683809-t4elhv222lo3e81sqcv4tuaem2ubind1.apps.googleusercontent.com';
var apiKey = 'AIzaSyADMz_1H-mtIBn5LlEi32T1VL3CttdUYEo';
var scopes = 'https://www.googleapis.com/auth/drive.readonly';

// Our first function is used to set the api key and
// is run once the google api is loaded in the page header.
function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth, 1);
}

function checkAuth() {
    gapi.auth.authorize(
        {
            'client_id': clientId,
            'scope': scopes,
            'immediate': true
        },
        handleAuthResult
    );
}

// Gets the result after the authorization and if successful,
// it makes the api call to get the  //user's information.
function handleAuthResult(authResult) {
    console.log('Handling authorization result for response:');
    console.log(authResult);
    if (authResult && !authResult.error) {
        localStorage.googleAccessToken = authResult.access_token;
        $('#google-login').hide();
        makeApiCall();
    } else {
        console.log('Enabling Google button');
        $('#google-login').fadeIn().bind('click', handleAuthClick);
    }
}

// Make api call on button click to authorize client
function handleAuthClick(event) {
    console.log('Handling authorization click for response:');
    console.log(event);
    gapi.auth.authorize(
        {
            'client_id': clientId,
            'scope': scopes,
            'immediate': false
        },
        handleAuthResult
    );

    return false;
}

// Load the API and make an API call
function makeApiCall() {
    gapi.client.load('drive', 'v3', requestFileList);
}

function requestFileList() {
    console.log('Requesting file list');
    gapi.client.request(
        {
            'path': '/drive/v3/files'
        }
    ).execute(handleFileList);
}

function handleFileList(response) {
    console.log('Handling file list for response:');
    console.log(response);
    if (response && !response.error) {
        var files = response.files, file;
        for (var i = 0; i < files.length; i++) {
            file = files[i];
            if (file.name == 'Cube Times') {
                requestFileExport(file.id);
                return;
            }
        }
        requestFileCreation('Cube Times');
    }
}

function requestFileExport(fileId) {
    console.log('Requesting file export for id ' + fileId);
    gapi.client.request(
        {
            'path': '/drive/v3/files/' + fileId + '/export',
            'method': 'GET',
            'headers': {
                'Authorization': 'Bearer ' + localStorage.googleAccessToken
            },
            'params': {
                'mimeType': 'text/csv'
            }
        }
    ).execute(handleFileExport);
}

function handleFileExport(response) {
    console.log('Handling file export for response:');
    console.log(response);
    if (response && !response.error) {
    }
}

function requestFileCreation(name) {
    console.log('Requesting file creation with name ' + name);
    console.log('TODO');
}
