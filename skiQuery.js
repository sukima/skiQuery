/**
 * This is ski %s, designed by Mark Stevans, ported by Eric S. Raymond.
 * You are hurtling down a ski slope in reverse, trying to evade the Yeti.
 * Available commands are:
 *
 *  l = turn left            r = turn right
 *  j = jump                 h = hop
 *  t = teleport             Enter = keep skiing
 *  i = launch ICBM          d = summon Fire Demon
 *
 *  ! = interpret line as shell command and execute.
 *  ? = print this help message.
 */
var SKI = { };
SKI.version = '1.0';
SKI.portVersion = '6.4';

// Section: Configuration and Constants {{{1
SKI.rep = {
    snow:   '.',
    tree:   'Y',
    ground: ':',
    ice:    '#',
    player: 'I',
    yeti:   'A',
    icbm:   '*',
    demon:  'D'
};

// Length of line
SKI.line_len = 70

// Minimum distance from the player at which a new Yeti may appear.
SKI.min_yeti_appearance_distance = 3

// Constant multiplied into the first element of the cellular growth
// automaton probability array with each passing level.
SKI.level_multiplier = 1.01

// Absolute value of maximum horizontal player speed.
SKI.max_horizontal_player_speed = 5

SKI.icbm_speed  = 3     // Horizontal speed of an ICBM.
SKI.icbm_range  = 2     // Horizontal Yeti lethality range of the ICBM.
SKI.demon_range = 1     // Horizontal Yeti lethality range of the demon.
SKI.demon_speed = 1     // Horizontal maximum speed of an ICBM.

// Per-turn probabilities
SKI.prob_yeti_melt      = 1.0   // Of Yeti spontaneously melting.
SKI.prob_skis_melt_yeti = 20.0  // Of melting Yeti by jumping over it.
SKI.prob_bad_spell      = 10.0  // Of "Summon Fire Demon" spell going awry.
SKI.prob_bad_teleport   = 10.0  // Of a teleport going wrong.
SKI.prob_bad_icbm       = 30.0  // Of your ICBM exploding on launch.
SKI.prob_slip_on_ice    = 2.0   // Of slipping when on ice.
SKI.prob_fall_on_ground = 10.0  // Of falling down on bare ground.
SKI.prob_hit_tree       = 25.0  // Of hitting tree, each turn in trees
SKI.prob_bad_landing    = 3.0   // Of land badly from jump or hop.

// Number of points awarded to the player for the successful completion
// of one jump.  For scoring purposes, a hop is considered to consist
// of exactly one half-jump.
SKI.points_per_jump     = 20

// Number of points awarded to the player for each meter of horizontal
// or vertical motion during each turn.
SKI.points_per_meter = 1

// Number of points awarded to the player for each Yeti that melts
// during the course of the game, regardless of whether the player
// passively caused the Yeti to melt by luring him from a snowbank, or
// actively melted the Yeti using his skis, an ICBM, or with the
// assistance of the Fire Demon.
SKI.points_per_melted_yeti = 100

// Number of pints docked from your score for each degree of injury.
SKI.points_per_injury_degree = -40

// The injury categories.
SKI.slight_injury               = 0
SKI.moderate_injury             = 3
SKI.severe_injury               = 6

// The randomness of injury degrees.
SKI.injury_randomness   = 6

SKI.colordict = {
    snow:    'white',
    tree:    'green',
    player:  'magenta',
    ground:  'yellow',
    ice:     'cyan',
    yeti:    'blue',
    icbm:    'magenta',
    demon:   'red'
};

// Section: Global functions {{{1
// Function: random(min, max) {{{2
SKI.random = function(min, max) {
    return Math.floor(Math.random() * max + min);
};

// Function: percent(X) {{{2
SKI.percent = function(X) {
    // Original algorythm in Python:
    // return (random.randint(0, 9999) / 100.0) <= (X)
    return (SKI.random(0, 9999) / 100.0) <= (X);
};

// Function: exists(X) {{{2
SKI.exists = function(X) {
    return X !== null;
};


// Class: SkiWorld {{{1
SKI.SkiWorld = function() {
    // Constants controlling the multiple cellular growth
    // automatons that are executed in parallel to generate
    // hazards.
    //
    // Each cellular growth automaton probability element tends to control a
    // different facet of hazard generation:
    //
    //    [0] appearance of new hazards in clear snow
    //    [1] hazards edge growth
    //    [2] hazards edge stability
    //    [3] appearance of holes in solid hazards (this allows the Yeti
    //        to work his way through forests)

    var that = this;

    // Instance variables {{{2
    this.prob_tree = [0.0, 30.0, 70.0, 90.0];
    this.prob_ice = [0.0, 30.0, 70.0, 90.0];
    this.prob_ground = [0.0, 30.0, 70.0, 90.0];

    this.level_num = 0;
    this.yeti = null;
    this.icbm_pos = null;
    this.demon_pos = null;

    // Set the player position.
    this.player_pos = that.teleport()

    // Initialize the line with snow.
    this.slope = new Array(SKI.line_len);
    for (var i=0; i < SKI.line_len; i++)
    {
        this.slope[i] = SKI.rep.snow;
    }

    // Randomize the appearance probabilities.
    this.prob_tree[0] = SKI.random(0, 99) / 500.0 + 0.05
    this.prob_ice[0] = SKI.random(0, 99) / 500.0 + 0.05
    this.prob_ground[0] = SKI.random(0, 99) / 500.0 + 0.05
    this.prob_yeti_appearance = SKI.random(0, 99) / 25.0 + 1.0

    // Function: terrain() {{{2
    this.terrain = function() {
        // What kind of terrain are we on?
        return that.slope[that.player_pos]);
    };

    // Function: nearby(pos, min) {{{2
    this.nearby = function(pos, min) {
        // Is the specified position near enough to the player?
        if ( !SKI.exists(min) ) min = 1;
        return SKI.exists(pos) && Math.abs(pos - that.player_pos) <= min;
    };
    
    // Function: teleport() {{{2
    this.teleport = function() {
        // Return a random location
        return SKI.random(0, that.slope.length - 1);
    };

    // Function: gen_next_slope(next_level) {{{2
    this.gen_next_slope = function(next_level) {
        // Generates the slope of the next level, dependent upon
        // the characteristics of the current level, the probabilities, and the
        // position of the player.

        // Stash away old state so we don't step on it while generating new
        var current_slope = that.slope.slice();

        // Generate each character of the next level.
        for (var i=0; i < that.slope.length; i++)
        {
            // Count the number of nearby trees, ice patches, and
            // ground patches on the current level.
            var num_nearby_trees = 0;
            var num_nearby_ice = 0;
            var num_nearby_ground = 0;

            if ( current_slope[i] == SKI.rep.tree )
                num_nearby_trees++;
            if ( current_slope[i] == SKI.rep.ice )
                num_nearby_ice++;
            if ( current_slope[i] == SKI.rep.ground )
                num_nearby_ground++;

            if ( i > 0 )
            {
                if ( current_slope[i - 1] == SKI.rep.tree )
                    num_nearby_trees++;
                if ( current_slope[i - 1] == SKI.rep.ice )
                    num_nearby_ice++;
                if ( current_slope[i - 1] == SKI.rep.ground )
                    num_nearby_ground++;
            }

            if ( i < that.slope.length - 1)
            {
                if ( current_slope[i + 1] == SKI.rep.tree )
                    num_nearby_trees++;
                if ( current_slope[i + 1] == SKI.rep.ice )
                    num_nearby_ice++;
                if ( current_slope[i + 1] == SKI.rep.ground )
                    num_nearby_ground++;
            }

            // Generate this character of the next level based upon
            // the characteristics of the nearby characters on the
            // current level.
            if ( SKI.percent(that.prob_tree[num_nearby_trees]) &&
                    ((i != that.player_pos) || (num_nearby_trees > 0)) )
                that.slope[i] = SKI.rep.tree;
            else if ( SKI.percent(that.prob_ice[num_nearby_ice]) &&
                    ((i != that.player_pos) || (num_nearby_ice > 0)) )
                that.slope[i] = SKI.rep.ice;
            else if ( SKI.percent(that.prob_ground[num_nearby_ground]) &&
                    ((i != that.player_pos) || (num_nearby_ground > 0)) )
                that.slope[i] = SKI.rep.ice;
            else
                that.slope[i] = SKI.rep.snow;
        }
    };

    // Function: update_level(player) {{{2
    this.update_level = function(player)  {
        // Go to the next level, and move the player.
        that.level_num++;

        // Figure out the new player position based on a modulo
        // addition.  Note that we must add the line length into the
        // expression before taking the modulus to make sure that we
        // are not taking the modulus of a negative integer.
        that.player_pos = (that.player_pos + player.player_speed +
            that.slope.length % that.slope.length);

        // Generate the updated slope.
        that.gen_next_slope();

        // If there is no Yeti, one might be created.
        if ( !SKI.exists(that.yeti) &&
            SKI.percent(that.prob_yeti_appearance) )
        {
            // Make sure that the Yeti does not appear too
            // close to the player.
            while (true)
            {
                that.yeti = that.teleport();
                if ( !that.nearby(that.yeti, SKI.min_yeti_appearance_distance) )
                    break;
            }
        }

        // Increase the initial appearance probabilities of all obstacles and
        // the Yeti.
        that.prob_tree[0] *= SKI.level_multiplier;
        that.prob_ice[0] *= SKI.level_multiplier;
        that.prob_ground[0] *= SKI.level_multiplier;
        that.prob_yeti_appearance *= SKI.level_multiplier;
    };

    // Function: manipulate_objects(player) {{{2
    this.manipulate_objects = function(player) {
        // If there is a Yeti, the player's jet-powered skis may melt him,
        // or he may spontaneously melt. Otherwise move him towards the player.
        // If there is a tree in the way, the Yeti is blocked.
        if ( SKI.exists(that.yeti) )
        {
            if ( (that.nearby(that.yeti)
                    && SKI.percent(SKI.prob_skis_melt_yeti))
                || SKI.percent(SKI.prob_yeti_melt) )
            {
                that.yeti = null;
                player.num_snomen_melted++;
            }
        }

        if ( SKI.exists(that.yeti) )
        {
            if ( that.yeti < that.player_pos )
            {
                if ( that.slope[that.yeti + 1] != SKI.rep.tree )
                    that.yeti += 1;
            }
            else
            {
                if ( that.slope[that.yeti - 1] != SKI.rep.tree )
                    that.yeti -= 1;
            }
        }

        // If there is an ICBM, handle it.
        if ( SKI.exists(that.icbm_pos) )
        {
            // If there is a Yeti, move the ICBM towards him.  Else,
            // self-destruct the ICBM.
            if ( SKI.exists(that.yeti) )
            {
                if ( that.icbm_pos < that.yeti )
                    that.icbm_pos += SKI.icbm_speed;
                else
                    that.icbm_pos -= SKI.icbm_speed;
            }
            else
                that.icbm_pos = null;
        }

        // If there is a fire demon on the level, handle it.
        if ( SKI.exists(that.demon_pos) )
        {
            // If there is a Yeti on the current level, move the demon
            // towards him.  Else, the demon might decide to leave.
            if ( SKI.exists(that.yeti) )
            {
                if ( that.demon_pos < that.yeti )
                    that.demon_pos += SKI.demon_speed;
                else
                    that.demon_pos -= SKI.demon_speed;
            }
            else
            {
                if ( SKI.percent(25.0) )
                    that.demon_pos = null;
            }
        }

        // If there is a Yeti and an ICBM on the slope, the Yeti
        // might get melted.
        if ( SKI.exists(that.yeti) && SKI.exists(that.icbm_pos) )
        {
            if ( Math.abs(that.yeti - that.icbm_pos) <= SKI.icbm_range )
            {
                that.icbm_pos = null;
                that.yeti = null;
                player.num_snomen_melted += 1;
            }
        }

        // If there is a Yeti and a fire demon, he might get melted.
        if ( SKI.exists(that.yeti) && SKI.exists(that.demon_pos) )
        {
            if ( Math.abs(that.yeti - that.demon_pos) <= 1 )
            {
                that.yeti = null;
                player.num_snomen_melted += 1;
            }
        }
    };

    // Function: toString() {{{2
    this.toString = function() {
        // Create a picture of the current level.
        var picture = that.slope.slice();
        picture[that.player_pos] = SKI.rep.player;
        if ( SKI.exists(that.yeti) )
            picture[that.yeti] = SKI.rep.yeti;
        if ( SKI.exists(that.demon_pos) )
            picture[that.demon_pos] = SKI.rep.demon;
        if ( SKI.exists(that.icbm_pos) )
            picture[that.icbm_pos] = SKI.rep.icbm;
        picture = SKI.colorize(picture);
        var str = "" + that.level_num;
        for (var i=0; i < picture.length; i++)
        {
            str += picture[i];
        }
        return str;
    };
    // }}}2

};


// Class: SkiPlayer {{{1
SKI.SkiPlayer = function() {
    var that = this;
};


// Function: colorize(picture) {{{1
SKI.colorize = function(picture) {
    // TODO: Colorize the output.
    // Do nothing for now.
    return picture;
};
// }}}1

/* vim:set et sw=4 ts=4 fdm=marker: */
