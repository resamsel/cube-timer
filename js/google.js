var clientId = '638606683809-t4elhv222lo3e81sqcv4tuaem2ubind1.apps.googleusercontent.com';
var apiKey = 'AIzaSyADMz_1H-mtIBn5LlEi32T1VL3CttdUYEo';
var scopes = 'https://www.googleapis.com/auth/drive.readonly';

// Our first function is used to set the api key and
// is run once the google api is loaded in the page header.
function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
}

//Gets the result after the authorization and if successful,
//it makes the api call to get the  //user's information.
function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        makeApiCall();
    }
}

//Make api call on button click to authorize client
function handleAuthClick(event) {
    console.log('handleAuthClick');
    gapi.auth.authorize(
        {
            client_id: clientId,
            scope: scopes,
            immediate: false
        },
        handleAuthResult
    );

    return false;
}

// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
    gapi.client.load('drive', 'v3', function () {
        var request = gapi.client.request({
            'path': '/drive/v3/files',
            'method': 'GET'
        });

        request.execute(function (response) {
            console.log(response);
            var files = response.files, file;
            for (var i = 0; i < files.length; i++) {
                file = files[i];
                if (file.name == 'Cube Times') {
                    console.log(file);
                }
            }
        });
    });
}

$(function () {
    var authorizeButton = document.getElementById('google-login');
    authorizeButton.onclick = handleAuthClick;
})
