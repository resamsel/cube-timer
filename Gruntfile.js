module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/*.html', 'src/manifest.json', 'src/background.js'],
                        dest: 'dist/<%= pkg.name %>'
                    },
                    { expand: true, flatten: true, src: ['bower_components/jquery/dist/jquery.min.js'], dest: 'dist/<%= pkg.name %>/js' },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'src/css/*',
                            '**/css/bootstrap.min.css',
                            '**/css/bootstrap-material-design.min.css',
                            '**/css/ripples.min.css'
                        ],
                        dest: 'dist/<%= pkg.name %>/css'
                    },
                    { expand: true, flatten: true, src: ['src/img/*'], dest: 'dist/<%= pkg.name %>/img' },
                    { expand: true, flatten: true, src: ['src/audio/*'], dest: 'dist/<%= pkg.name %>/audio' },
                    { expand: true, flatten: true, src: ['bower_components/bootstrap/dist/fonts/*'], dest: 'dist/<%= pkg.name %>/fonts' },
                ]
            }
        },
        
        downloadfile: {
            files: [
                {
                    url: 'https://apis.google.com/js/api.js',
                    dest: 'dist/<%= pkg.name %>/js',
                    name: 'google-api.js'
                }
            ]
        },

        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                // the files to concatenate
                src: [
                    'src/js/**/*.js',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'bower_components/jquery-migrate/jquery-migrate.min.js'
                ],
                // the location of the resulting JS file
                dest: 'dist/<%= pkg.name %>/js/<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        jshint: {
            // define the files to lint
            files: ['src/js/*.js', 'test/**/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                }
            }
        },

        zip: {
            'dist/<%= pkg.name %>.zip': [
                'dist/<%= pkg.name %>/**'
            ]
        },

        watch: {
            files: ['<%= jshint.files %>', 'src/**'],
            tasks: ['jshint', 'dist']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-downloadfile');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('dist', ['copy', 'downloadfile', 'concat', 'uglify']);
    grunt.registerTask('package', ['dist', 'zip']);

};
