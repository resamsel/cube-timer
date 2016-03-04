chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create(
        'index.html',
        {
            id: 'cube-timer-main',
            outerBounds: {
                width: 800,
                height: 600
            }
        }
    );
});
