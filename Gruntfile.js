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
                    { expand: true, flatten: true, src: ['src/img/*'], dest: 'dist/<%= pkg.name %>/img' },
                    { expand: true, flatten: true, src: ['src/audio/*'], dest: 'dist/<%= pkg.name %>/audio' },
                ]
            }
        },
        
        downloadfile: {
            files: [
                {
                    url: 'https://apis.google.com/js/api.js',
                    dest: 'dist/<%= pkg.name %>/js',
                    name: 'google-api.js'
                },
                {
                    url: 'https://fonts.gstatic.com/s/materialicons/v11/2fcrYFNaTjcS6g4U3t-Y5UEw0lE80llgEseQY3FEmqw.woff2',
                    dest: 'dist/<%= pkg.name %>/fonts',
                    name: 'material-icons.woff2'
                }
            ]
        },

        concat: {
            js: {
                // the files to concatenate
                src: [
                    'src/js/**/*.js',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'bower_components/jquery-migrate/jquery-migrate.min.js'
                ],
                dest: 'dist/<%= pkg.name %>/js/<%= pkg.name %>.js'
            },
            css: {
                // the files to concatenate
                src: [
                    'bower_components/bootstrap/dist/css/bootstrap.min.css',
                    'bower_components/bootstrap-material-design/dist/css/bootstrap-material-design.min.css',
                    'bower_components/bootstrap-material-design/dist/css/ripples.min.css',
                    'src/css/*.css'
                ],
                dest: 'dist/<%= pkg.name %>/css/<%= pkg.name %>.css'
            }
        },

        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>/js/<%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
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

        watch: {
            files: ['<%= jshint.files %>', 'src/**'],
            tasks: ['jshint', 'dist']
        },

        compress: {
            main: {
                options: {
                    archive: 'dist/<%= pkg.name %>.zip'
                },
                files: [
                    {
                        expand: true,
                        src: ['<%= pkg.name %>/**'],
                        cwd: 'dist/',
                        dest: ''
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-downloadfile');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask(
        'assemble',
        [
            'copy',
            'downloadfile',
            'concat',
//            'uglify'
        ]
    );
    grunt.registerTask('dist', ['assemble', 'compress']);

};
