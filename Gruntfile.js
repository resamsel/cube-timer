module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,

        copy: {
            main: {
                expand: true,
                cwd: 'src/',
                src: ['*.html', 'background.js', '_locales/**'],
                dest: 'dist/<%= pkg.name %>'
            },
            js: {
                expand: true,
                flatten: true,
                src: [
                    'node_modules/jquery/dist/jquery.min.js'
                ],
                dest: 'dist/<%= pkg.name %>/js'
            },
            image: {
                expand: true,
                flatten: true,
                src: 'src/img/*',
                dest: 'dist/<%= pkg.name %>/img'
            },
            font: {
                expand: true,
                cwd: 'node_modules/materialize-css/dist/font/',
                src: [
                    'roboto/*'
                ],
                dest: 'dist/<%= pkg.name %>/font'
            },
            audio: {
                expand: true,
                flatten: true,
                src: 'src/audio/*',
                dest: 'dist/<%= pkg.name %>/audio'
            },
            manifest: {
                expand: true,
                cwd: 'src/',
                src: 'manifest.json',
                dest: 'dist/<%= pkg.name %>',
                options: {
                    process: function (content, srcpath) {
                        return content.replace(/@@version/g, pkg.version);
                    }
                }
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
                    dest: 'dist/<%= pkg.name %>/font',
                    name: 'material-icons.woff2'
                }
            ]
        },

        concat: {
            js: {
                // the files to concatenate
                src: [
                    //'node_modules/bootstrap/dist/js/bootstrap.min.js',
                    'node_modules/jquery-migrate/jquery-migrate.min.js',
                    'node_modules/materialize-css/dist/js/materialize.min.js',
                    'node_modules/chartist/dist/chartist.min.js',
                    'src/js/config.js',
                    'src/js/core.js',
                    'src/js/modules/*.js',
                    'src/js/other/*.js',
                    'src/js/external/*.js'
                ],
                dest: 'dist/<%= pkg.name %>/js/<%= pkg.name %>.js'
            },
            css: {
                // the files to concatenate
                src: [
                    //'node_modules/bootstrap/dist/css/bootstrap.min.css',
                    //'node_modules/bootstrap-material-design/dist/css/bootstrap-material-design.min.css',
                    //'node_modules/bootstrap-material-design/dist/css/ripples.min.css',
                    'node_modules/materialize-css/dist/css/materialize.min.css',
                    'node_modules/chartist/dist/chartist.min.css',
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
            files: [
                'src/js/config.js',
                'src/js/core.js',
                'src/js/modules/*.js',
                'src/js/other/*.js',
                'test/**/*.js'
            ],
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
