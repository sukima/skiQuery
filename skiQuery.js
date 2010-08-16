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
    return X && X !== null;
};

// Function: show_doc() {{{2
SKI.show_doc = function() {
    var doc = $("<div id=\"ski-manual\" />");
    doc.append("<tt />");
    var str = "";
    str += "This is ski " + SKI.portVersion + ", designed by Mark Stevans, ported to python by Eric S. Raymond.<br />";
    str += "jQuery port by Devin Weaver, version " + SKI.version + "<br />";
    str += "You are hurtling down a ski slope in reverse, trying to evade the Yeti.<br />";
    str += "Expanded manual available <a href=\"http://catb.org/~esr/ski/ski.html\">online</a>.<br />";
    str += "Available commands are:<br />";
    str += "<br />";
    $("tt", doc).append(str);

    str = "";
    str += "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
    str += "<tr><td>l = turn left</td><td>r = turn right</td></tr>";
    str += "<tr><td>j = jump</td><td>h = hop</td></tr>";
    str += "<tr><td>t = teleport</td><td>Enter = keep skiing</td></tr>";
    str += "<tr><td>i = launch ICBM</td><td>d = summon Fire Demon</td></tr>";
    str += "<tr><td colspan=\"2\">&nbsp;</td></tr>";
    str += "<tr><td colspan=\"2\">! = interpret line as shell command and execute.</td></tr>";
    str += "<tr><td colspan=\"2\">? = print this help message.</td></tr>";
    str += "</table><br />";
    $("tt", doc).append(str);

    str = "";
    str += "<dl><dt>Terrain types:</dt>";
    str += "<dd>" + SKI.colorize(SKI.rep.snow) + " = snow</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.tree) + " = tree</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.ground) + " = bare ground</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.ice) + " = ice</dd>";
    str += "<dt>Creatures:</dt>";
    str += "<dd>" + SKI.colorize(SKI.rep.player) + " = player</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.yeti) + " = yeti</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.icbm) + " = ICBM</dd>";
    str += "<dd>" + SKI.colorize(SKI.rep.demon) + " = fire demon</dd>";
    str += "</dl>";
    $("tt", doc).append(str);

    /*
    if ( false )
    {
        // TODO: jQuery-ui popup

        var input = $("<input type=\"button\" />");
        input.click(function() {
            doc.hide();
        });

        doc.append(input);
    }
    else
        */
    SKI.print(doc, true);
};

// Function: console(cmdline) {{{2
SKI.console = function(cmdline) {
    // TODO:
};


// Function: print(msg,inline) {{{2
SKI.print = function(msg,inline) {
    if ( typeof(msg) == 'string' )
        msg += "<br />";

    if ( inline && SKI.run_state.ski_slope )
    {
        SKI.run_state.ski_slope.append("<span class=\"ski-text\" />");
        $("span.ski-text:last", SKI.run_state.ski_slope).append(msg);
    }
    else if ( SKI.exists(SKI.run_state.console) )
    {
        SKI.run_state.console.append("<span class=\"ski-text\" />");
        $("span.ski-text:last", SKI.run_state.console).append(msg);
    }
};

// Function: printSlope(line) {{{2
SKI.printSlope = function(world) {
    if ( SKI.exists(SKI.run_state.ski_slope) )
        SKI.run_state.ski_slope.append(
            "<li class=\"ski-slope-line\"><span class=\"ski-terrain\">"
            + world.toHTML() + "</span>" +
            "<span class=\"ski-prompt\"></span>&nbsp;" +
            "<span class=\"ski-prompt-input\"></span></li>");
};

// Function: printPrompt(p) {{{2
SKI.printPrompt = function(p) {
    if ( !SKI.exists(p) )
        p = '?';
    if ( SKI.exists(SKI.run_state.ski_slope) )
        $(".ski-prompt:last", SKI.run_state.ski_slope).html(p);
};

//Function: printInputPrompt() {{{2
SKI.printInputPrompt = function() {
    if ( SKI.exists(SKI.run_state.input) )
    {
        // Will move the input field to the correct place.
        $(".ski-prompt-input:last").append(SKI.run_state.input);
        // Reenable the field.
        SKI.run_state.input.removeAttr("disabled");
        SKI.run_state.input.val("").focus();
    }
};

// Function: exit(code) {{{2
// You can `return SKI.exit()` to step back out of the run loop.
// JavaScript has no exit/run loop since it is event based.
SKI.exit = function() {
    SKI.run_state.end_game = true;
    SKI.run_state.input.remove();
    return false;
};

// Function: colorize(picture) {{{2
SKI.colorize = function(picture) {
    // Colorize special characters in a display list.
    // TODO:
    return picture;
};

// Function: checkJQuery() {{{2
SKI.checkJQuery = function() {
    if ( !SKI.exists(jQuery) )
    {
        var fileref=document.createElement('script');
        fileref.setAttribute("type", "text/javascript");
        fileref.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js");
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }
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
        return that.slope[that.player_pos];
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
        that.player_pos = ((that.player_pos + player.player_speed +
            that.slope.length) % that.slope.length);

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

    // Function: getPicture() {{{2
    this.getPicture = function() {
        // Create a picture of the current level.
        var picture = that.slope.slice();
        picture[that.player_pos] = SKI.rep.player;
        if ( SKI.exists(that.yeti) )
            picture[that.yeti] = SKI.rep.yeti;
        if ( SKI.exists(that.demon_pos) )
            picture[that.demon_pos] = SKI.rep.demon;
        if ( SKI.exists(that.icbm_pos) )
            picture[that.icbm_pos] = SKI.rep.icbm;
        return picture;
    };

    // Function: toHTML() {{{2
    this.toHTML = function() {
        var picture = that.getPicture();
        var html = "";
        for (var i=0; i < picture.length; i++)
        {
            html += SKI.colorize(picture[i]);
        }
        return html;
    };

    // Function: toString() {{{2
    this.toString = function() {
        var picture = that.getPicture();
        for (var i=0; i < picture.length; i++)
        {
            str += picture[i];
        }
        return str;
    };
    // }}}2

    // Set the player position.
    this.player_pos = this.teleport();

};


// Class: SkiPlayer {{{1
SKI.SkiPlayer = function() {
    var that = this;

    // Instance variables {{{2
    this.jump_count = -1;
    this.num_snomen_melted = 0;
	this.num_jumps_attempted = 0.0;
	this.player_speed = 0;
	this.meters_travelled = 0;

    // Function: accident(msg, severity) {{{2
    this.accident = function(msg, severity) {
        // "accident()" is called when the player gets into an accident(),
        // which ends the game.  "msg" is the description of the accident()
        // type, and "severity" is the severity.  This function should never
        // return. Compute the degree of the player's injuries.
        var degree = severity + SKI.random(0, SKI.injury_randomness - 1);

        // Print a message indicating the termination of the game.
        SKI.printPrompt("!");
        SKI.print(msg + "  " + SKI.SkiPlayer.injuries[degree]);
    
        // Print the statistics of the game.
        SKI.print("You skiied " + that.meters_travelled +
            " meters with " + that.num_jumps_attempted +
            " jumps and melted " + that.num_snomen_melted +
            ((that.num_snomen_melted != 1) ? " Yetis" : " Yeti") + ".");

        // Initially calculate the player's score based upon the number of
        // meters travelled.
        var score = that.meters_travelled * SKI.points_per_meter;

        // Add bonus points for the number of jumps completed.
        score += that.num_jumps_attempted * SKI.points_per_jump;

        // Add bonus points for each Yeti that melted during the course of
        // the game.
        score += that.num_snomen_melted * SKI.points_per_melted_yeti;

        // Subtract a penalty for the degree of injury experienced by the
        // player.
        score += degree * SKI.points_per_injury_degree;

        // Negative scores are just too silly.
        if ( score < 0 )
            score = 0;

        // Print the player's score.
        SKI.print("Your score for this run is " + score + ".");

        // Exit the game with a code indicating successful completion.
        return SKI.exit();
    };

    // Function: check_obstacles(world) {{{2
    this.check_obstacles = function(world) {
        // If we are just landing after a jump, we might fall down.
        if ( (that.jump_count == 0) && SKI.percent(SKI.prob_bad_landing) )
            return that.accident("Whoops!  A bad landing!", SKI.light_injury);

        // If there is a tree in our position, we might hit it.
        if ( (world.terrain() == SKI.rep.tree) && SKI.percent(SKI.prob_hit_tree) )
            return that.accident("Oh no!  You hit a tree!", SKI.severe_injury);

        // If there is bare ground under us, we might fall down.
        if ( (world.terrain() == SKI.rep.ground) && SKI.percent(SKI.prob_fall_on_ground) )
            return that.accident("You fell on the ground!", SKI.moderate_injury);

        // If we are on ice, we might slip.
        if ( (world.terrain() == SKI.rep.ice) && SKI.percent(SKI.prob_slip_on_ice) )
            return that.accident("Oops!  You slipped on the ice!", SKI.slight_injury);

        // If there is a Yeti next to us, he may grab us.
        if ( world.nearby(world.yeti) )
            return that.accident("Yikes!  The Yeti's got you!", SKI.moderate_injury);

        return true;
    };

    // Function: update_player() {{{2
    this.update_player = function() {
        // Update state of player for current move.
        that.meters_travelled += Math.abs(that.player_speed) + 1;
        // If the player was jumping, decrement the jump count.
        if ( that.jump_count >= 0 )
            that.jump_count -= 1;
    };

    // Function: do_command(world, cmdline) {{{2
    this.do_command = function(world, cmdline) {
        // Print a prompt, and read a command.  Return True to advance game.
        if ( !SKI.exists(cmdline) )
            cmdline = " ";
        switch ( cmdline.charAt(0).toUpperCase() )
        {
            case '?':
                SKI.show_doc();
                return false;
            case '!':
                SKI.console(cmdline.substring(1));
                return false;
            case 'R':  // Move right
                if ( (world.terrain() != SKI.rep.ice)
                        && (that.player_speed < SKI.max_horizontal_player_speed) )
                    that.player_speed += 1;
                return true;
            case 'L':  // Move left
                if ( (world.terrain() != SKI.rep.ice)
                        && (that.player_speed > -SKI.max_horizontal_player_speed) )
                    that.player_speed -= 1;
                return true;
            case 'J':  // Jump
                that.jump_count = SKI.random(0, 5) + 4;
                that.num_jumps_attempted += 1.0;
                return true;
            case 'H':  // Do a hop
                that.jump_count = SKI.random(0, 2) + 2;
                that.num_jumps_attempted += 0.5;
                return true;
            case 'T':  // Attempt teleportation
                if ( SKI.percent(SKI.prob_bad_teleport) )
                    return that.accident("You materialized 25 feet in the air!", SKI.slight_injury);
                world.player_pos = world.teleport();
                return true;
            case 'I':  // Launch backpack ICBM
                if ( SKI.percent(SKI.prob_bad_icbm) )
                    return that.accident("Nuclear blast in your backpack!", SKI.severe_injury);
                world.icbm_pos = world.player_pos;
                return true;
            case 'D':  // Incant spell for fire demon
                if ( SKI.percent(SKI.prob_bad_spell) )
                    return that.accident("A bad spell -- the demon grabs you!", SKI.moderate_injury);
                world.demon_pos = world.teleport();
                return true;
            default:
                // Any other command just advances
                return true;
        }
    };
};

// Class variables {{{2
SKI.SkiPlayer.injuries = [
    "However, you escaped injury!", 
    "But you weren't hurt at all!", 
    "But you only got a few scratches.", 
    "You received some cuts and bruises.", 
    "You wind up with a concussion and some contusions.", 
    "You now have a broken rib.", 
    "Your left arm has been fractured.",
    "You suffered a broken ankle.",
    "You have a broken arm and a broken leg.", 
    "You have four broken limbs and a cut!", 
    "You broke every bone in your body!", 
    "I'm sorry to tell you that you have been killed...."];


// Main run loop {{{1
// These functions are public. Run state can be hacked. Play nice.
// Cheating seems silly.
SKI.run_state = {
    repeat: 1,
    end_game: false,
    world: null,
    player: null,
    console: null,
    ski_slope: null,
    input: null,
};

// Function: run_update(cmd) {{{2
SKI.run_update = function(cmd) {
    if ( !SKI.run_state.player.do_command(SKI.run_state.world, cmd) )
        return false;
    SKI.run_state.world.manipulate_objects(SKI.run_state.player);
    SKI.run_state.world.update_level(SKI.run_state.player);
    SKI.run_state.player.update_player();
};

// Function: run_trigger() {{{2
SKI.run_trigger = function() {
    // Disable field to prevent further input.
    SKI.run_state.input.attr("disabled","disabled");

    var cmd = SKI.run_state.input.val();

    // Freeze former command.
    $(".ski-prompt-input:last").append(cmd);
    
    // Repeat logic
    if ( cmd > 0 ) // Check if number
    {
        cmd = cmd * 1; // Convert to number
        for (var x=0; x < cmd; x++)
        {
            SKI.run_update(null);
            if ( SKI.run_state.end_game )
                return

            SKI.printSlope(SKI.run_state.world);

            if ( !SKI.run_state.player.check_obstacles(SKI.run_state.world) )
                return;
        }
    }
    else
    {
        SKI.run_update(cmd);
        if ( SKI.run_state.end_game )
            return;

        SKI.printSlope(SKI.run_state.world);
        
        // If we are jumping, just finish the line.  Otherwise, check for
        // obstacles, and do a command.
        while ( SKI.run_state.player.jump_count >= 0 )
        {
            SKI.run_update(null);
            if ( SKI.run_state.end_game )
                return

            SKI.printSlope(SKI.run_state.world);
            // Don't check for obstacles till the end
        }

        if ( !SKI.run_state.player.check_obstacles(SKI.run_state.world) )
            return;
    }

    // Turn is done.
    SKI.printPrompt();
    SKI.printInputPrompt();
};

// Function: run() {{{2
SKI.run = function(div) {
    SKI.checkJQuery();

    if ( !SKI.exists(div) )
        div = $(document.body);

    SKI.run_state.repeat = 1;
    SKI.run_state.end_game = false;
    SKI.run_state.command = null;
    SKI.run_state.loop_gaurd = 0;
    SKI.run_state.world = new SKI.SkiWorld();
    SKI.run_state.player = new SKI.SkiPlayer();

    // Create the <pre/> for the text output.
    SKI.run_state.console = $("<tt id=\"ski-console\" />");
    // Create the <ol/> for the slope text.
    SKI.run_state.ski_slope = $("<ol id=\"ski-slope\" />");
    // Create the input text field.
    SKI.run_state.input = $("<input id=\"ski-input\" type=\"text\" size=\"3\" />");
    SKI.run_state.input.keypress(function (event) {
        if ( event.keyCode == "13" )
        {
            event.preventDefault();
            SKI.run_trigger();
        }
    });

    $(div).empty().append(SKI.run_state.console);

    SKI.print("SKI!  Version " + SKI.portVersion + ". Type ? for help.");
    SKI.print("skiQuery port version " + SKI.version + " by Devin Weaver");

    SKI.run_state.console.append(SKI.run_state.ski_slope);

    SKI.printSlope(SKI.run_state.world);
    SKI.printPrompt();
    SKI.printInputPrompt();
};
// }}}1

/* vim:set et sw=4 ts=4 fdm=marker: */
