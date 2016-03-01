var config = {
    activeGame: '3x3x3',
    stats: [
        'latest',
        'best', 'best5', 'best12',
        'worst', 'worst5', 'worst12',
        'best80', 'best3of5', 'best10of12',
        'stddev', 'stddev5', 'stddev12',
        'average', 'average5', 'average12',
        'average80', 'average3of5', 'average10of12',
        'median', 'median5', 'median12',
        'median80', 'median3of5', 'median10of12',
    ],
    subs: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        25, 30, 35, 40, 45, 50, 55, 60,
        70, 80, 60+30, 100, 110,
        2*60, 2*60+30, 3*60, 4*60, 5*60,
        6*60, 7*60, 8*60, 9*60, 10*60,
        12*60, 15*60, 20*60, 30*60, 40*60, 50*60, 60*60
    ],
    scrambles: {
        '2x2x2': { len: 15 },
        '3x3x3': { len: 25 }
    }
};