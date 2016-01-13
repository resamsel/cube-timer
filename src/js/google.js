var clientId = '638606683809-t4elhv222lo3e81sqcv4tuaem2ubind1.apps.googleusercontent.com';
var appId = '638606683809';
var apiKey = 'AIzaSyADMz_1H-mtIBn5LlEi32T1VL3CttdUYEo';
var scopes = 'https://www.googleapis.com/auth/drive';
var oauthToken;

// Our first function is used to set the api key and
// is run once the google api is loaded in the page header.
function handlePickerClick() {
    gapi.load('auth', {'callback': onAuthApiLoad});
    gapi.load('picker', {'callback': onPickerApiLoad});
}

// Gets the result after the authorization and if successful,
// it makes the api call to get the  //user's information.
function handleAuthResult(authResult) {
    console.log('Handling authorization result for response:');
    console.log(authResult);
    if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        createPicker();
        $('#google-login').hide();
    } else {
        console.log('Enabling Google button');
        $('#google-login').fadeIn().bind('click', onAuthApiLoad);
    }
}

// Make api call on button click to authorize client
function onAuthApiLoad(event) {
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

function onPickerApiLoad() {
    pickerApiLoaded = true;
    createPicker();
}

// Create and render a Picker object for searching images.
function createPicker() {
    if (pickerApiLoaded && oauthToken) {
        var view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("application/vnd.google-apps.spreadsheet");
        var picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(appId)
            .setOAuthToken(oauthToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(apiKey)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }
}

// A simple callback implementation.
function pickerCallback(data) {
    if (data.action == google.picker.Action.PICKED) {
        var fileId = data.docs[0].id;
        gapi.load(
            'client', {
            'callback': function() {
                requestFileExport(fileId);
            }
        });
    }
}

function requestFileExport(fileId) {
    console.log('Requesting file export for id ' + fileId);
    gapi.client.request(
        {
            'path': '/drive/v3/files/' + fileId + '/export',
            'method': 'GET',
            'headers': {
                'Authorization': 'Bearer ' + oauthToken
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
        // TODO: Put text into textarea
        showImportData(response.text);
    } else {
        $('#import-error .content')
            .text('Server error while exporting selected file: ' + response.error.message);
        $('#import-error').fadeIn();
    }
}
