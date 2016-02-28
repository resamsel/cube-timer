function migrate() {
    dao.get('databaseVersion', function(databaseVersion) {
        if(typeof(databaseVersion) === 'undefined') {
            databaseVersion = 0;
        }
        if(databaseVersion < 1) {
            // Migrate data set to support multiple games
            // 1. retrieve data
            dao.get('scores', function(scores) {
                // 2. remove data in scores
                dao.remove('scores');

                // 3. store data in game '3x3x3'
                dao.set('scores-3x3x3', scores);

                dao.set('databaseVersion', 1);
            });
        }
    });
}
