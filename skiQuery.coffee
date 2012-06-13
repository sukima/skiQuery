###
This is ski %s, designed by Mark Stevans, ported by Eric S. Raymond.
You are hurtling down a ski slope in reverse, trying to evade the Yeti.
Available commands are:

 l = turn left            r = turn right
 j = jump                 h = hop
 t = teleport             Enter = keep skiing
 i = launch ICBM          d = summon Fire Demon

 ! = interpret line as shell command and execute.
 ? = print this help message.
###

$ = if jQuery? then jQuery else {}

window.SKI =
  version: '1.0'
  portVersion: '6.4'

# Section: Configuration and Constants {{{1
SKI.rep =
  snow:   '.'
  tree:   'Y'
  ground: ':'
  ice:    '#'
  player: 'I'
  yeti:   'A'
  icbm:   '*'
  demon:  'D'

# Length of line
SKI.line_len = 70

# Minimum distance from the player at which a new Yeti may appear.
SKI.min_yeti_appearance_distance = 3

# Constant multiplied into the first element of the cellular growth
# automaton probability array with each passing level.
SKI.level_multiplier = 1.01

# Absolute value of maximum horizontal player speed.
SKI.max_horizontal_player_speed = 5

SKI.icbm_speed  = 3     # Horizontal speed of an ICBM.
SKI.icbm_range  = 2     # Horizontal Yeti lethality range of the ICBM.
SKI.demon_range = 1     # Horizontal Yeti lethality range of the demon.
SKI.demon_speed = 1     # Horizontal maximum speed of an ICBM.

# Per-turn probabilities
SKI.prob_yeti_melt      = 1.0   # Of Yeti spontaneously melting.
SKI.prob_skis_melt_yeti = 20.0  # Of melting Yeti by jumping over it.
SKI.prob_bad_spell      = 10.0  # Of "Summon Fire Demon" spell going awry.
SKI.prob_bad_teleport   = 10.0  # Of a teleport going wrong.
SKI.prob_bad_icbm       = 30.0  # Of your ICBM exploding on launch.
SKI.prob_slip_on_ice    = 2.0   # Of slipping when on ice.
SKI.prob_fall_on_ground = 10.0  # Of falling down on bare ground.
SKI.prob_hit_tree       = 25.0  # Of hitting tree, each turn in trees
SKI.prob_bad_landing    = 3.0   # Of land badly from jump or hop.

# Number of points awarded to the player for the successful completion
# of one jump.  For scoring purposes, a hop is considered to consist
# of exactly one half-jump.
SKI.points_per_jump     = 20

# Number of points awarded to the player for each meter of horizontal
# or vertical motion during each turn.
SKI.points_per_meter = 1

# Number of points awarded to the player for each Yeti that melts
# during the course of the game, regardless of whether the player
# passively caused the Yeti to melt by luring him from a snowbank, or
# actively melted the Yeti using his skis, an ICBM, or with the
# assistance of the Fire Demon.
SKI.points_per_melted_yeti = 100

# Number of pints docked from your score for each degree of injury.
SKI.points_per_injury_degree = -40

# The injury categories.
SKI.slight_injury               = 0
SKI.moderate_injury             = 3
SKI.severe_injury               = 6

# The randomness of injury degrees.
SKI.injury_randomness   = 6

SKI.colordict =
  snow:       'black'
  tree:       'green'
  player:     'magenta'
  ground:     'yellow'
  ice:        'cyan'
  yeti:       'blue'
  icbm:       'magenta'
  demon:      'red'
  background: 'lightgrey'


# Section: Global functions {{{1
# Function: random(min, max) {{{2
SKI.random = (min, max) -> Math.floor Math.random() * max + min

# Function: percent(X) {{{2
SKI.percent = (X) ->
  # Original algorythm in Python:
  # return (random.randint(0, 9999) / 100.0) <= (X)
  (SKI.random(0, 9999) / 100.0) <= X

# Function: exists(X) {{{2
SKI.exists = (X) -> X and X isnt null # FIXME: should be `X?`

# Function: show_doc() {{{2
SKI.show_doc = ->
  @documentation ||= $('<div id="ski-manual" />').append """
    <tt>
      This is ski #{SKI.portVersion}, designed by Mark Stevans, ported to python by Eric S. Raymond.<br />
      jQuery port by Devin Weaver, version #{SKI.version}<br />
      You are hurtling down a ski slope in reverse, trying to evade the Yeti.<br />
      Expanded manual available <a target="_blank" href="http://catb.org/~esr/ski/ski.html">online</a>.<br />
      Available commands are:<br /><br />
      <table border="0" cellpadding="0" cellspacing="0">
      <tr><td>l = turn left</td><td>r = turn right</td></tr>
      <tr><td>j = jump</td><td>h = hop</td></tr>
      <tr><td>t = teleport</td><td>Enter = keep skiing</td></tr>
      <tr><td>i = launch ICBM</td><td>d = summon Fire Demon</td></tr>
      <tr><td colspan="2">&nbsp;</td></tr>
      <tr><td colspan="2">! = interpret line as shell command and execute.</td></tr>
      <tr><td colspan="2">? = print this help message.</td></tr>
      </table><br />
      <table border="0" cellpadding="0" cellspacing="0"><tr>
      <td>Terrain types: &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.snow} = snow &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.tree} = tree &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.ground} = bare ground &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.ice} = ice &nbsp; </td>
      </tr><tr>
      <td>Creatures: &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.player} = player &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.yeti} = yeti &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.icbm} = ICBM &nbsp; </td>
      <td>#{SKI.colorize SKI.rep.demon} = fire demon &nbsp; </td>
      </tr></table>
    </tt>
    """

  SKI.print(@documentation, true);

# Function: console(cmdline) {{{2
SKI.console = -> # TODO:


# Function: print(msg,inline) {{{2
SKI.print = (msg,inline) ->
  msg += "<br />" if typeof(msg) is 'string'

  if inline and SKI.run_state.ski_slope
    SKI.run_state.ski_slope.append("<span class=\"ski-text\" />")
    $("span.ski-text:last", SKI.run_state.ski_slope).append(msg)
  else if SKI.exists(SKI.run_state.console)
    SKI.run_state.console.append("<span class=\"ski-text\" />")
    $("span.ski-text:last", SKI.run_state.console).append(msg)

# Function: printSlope(line) {{{2
SKI.printSlope = (world) ->
  if SKI.exists(SKI.run_state.ski_slope)
    SKI.run_state.ski_slope.append """
      <li class="ski-slope-line"><span class="ski-terrain">
      #{world.toHTML()}</span><span class="ski-prompt">
      </span>&nbsp;<span class="ski-prompt-input"></span></li>
      """

# Function: printPrompt(p) {{{2
SKI.printPrompt = (p='?') ->
  if SKI.exists(SKI.run_state.ski_slope)
    $(".ski-prompt:last", SKI.run_state.ski_slope).html(p)

# Function: printInputPrompt() {{{2
SKI.printInputPrompt = ->
  if SKI.exists(SKI.run_state.input)
    # Will move the input field to the correct place.
    $(".ski-prompt-input:last").append(SKI.run_state.input)
    # Reenable the field.
    SKI.run_state.input.removeAttr("disabled")
    SKI.run_state.input.val("").focus()

# Function: exit(code) {{{2
# You can `return SKI.exit()` to step back out of the run loop.
# JavaScript has no exit/run loop since it is event based.
SKI.exit = ->
  SKI.run_state.end_game = true

  # Do a bad hack to force the browser to scroll to the bottom when game
  # ends by giving focus to the input box and then removing it.
  SKI.run_state.console.append(SKI.run_state.input)
  SKI.run_state.input.removeAttr("disabled").focus().remove()

  false

# Function: colorize(rep) {{{2
SKI.colorize = (rep) ->
  # Colorize special characters in a display list.

  # JavaScript doesn't do reverse look-ups of hashes. Since this requires a
  # looping through the hash we will do so here and cache the result. Lazy
  # loading.
  if !SKI.exists(SKI.colordict[rep])
    for i of SKI.rep
      SKI.colordict[SKI.rep[i]] = SKI.colordict[i]

  "<span style=\"color:#{SKI.colordict[rep]}\">#{rep}</span>"

# Function: checkJQuery() {{{2
SKI.checkJQuery = ->
  unless SKI.exists(jQuery)
    fileref = document.createElement('script')
    fileref.setAttribute("type", "text/javascript")
    fileref.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js")
    document.getElementsByTagName("head")[0].appendChild(fileref)


# Class: SkiWorld {{{1
class SKI.SkiWorld
  # Constants controlling the multiple cellular growth
  # automatons that are executed in parallel to generate
  # hazards.
  #
  # Each cellular growth automaton probability element tends to control a
  # different facet of hazard generation:
  #
  #    [0] appearance of new hazards in clear snow
  #    [1] hazards edge growth
  #    [2] hazards edge stability
  #    [3] appearance of holes in solid hazards (this allows the Yeti
  #        to work his way through forests)

  # Instance variables {{{2
  prob_tree: [0.0, 30.0, 70.0, 90.0]
  prob_ice: [0.0, 30.0, 70.0, 90.0]
  prob_ground: [0.0, 30.0, 70.0, 90.0]

  level_num: 0
  yeti: null
  icbm_pos: null
  demon_pos: null

  # Constructor {{{2
  constructor: ->
    # Initialize the line with snow.
    @slope = new Array(SKI.line_len)
    @slope[i] = SKI.rep.snow for i in [0..SKI.line_len]

    # Randomize the appearance probabilities.
    @prob_tree[0] = SKI.random(0, 99) / 500.0 + 0.05
    @prob_ice[0] = SKI.random(0, 99) / 500.0 + 0.05
    @prob_ground[0] = SKI.random(0, 99) / 500.0 + 0.05
    @prob_yeti_appearance = SKI.random(0, 99) / 25.0 + 1.0
    
    # Set the player position.
    @player_pos = @teleport();

  # Function: terrain() {{{2
  # What kind of terrain are we on?
  terrain: -> @slope[@player_pos]

  # Function: nearby(pos, min) {{{2
  # Is the specified position near enough to the player?
  nearby: (pos, min=1) -> Math.abs(pos - @player_pos) <= min
    
  # Function: teleport() {{{2
  # Return a random location
  teleport: -> SKI.random(0, @slope.length - 1)

  # Function: gen_next_slope(next_level) {{{2
  gen_next_slope: (next_level) ->
    # Generates the slope of the next level, dependent upon
    # the characteristics of the current level, the probabilities, and the
    # position of the player.

    # Stash away old state so we don't step on it while generating new
    tmp_slope = @slope[..]

    # Generate each character of the next level.
    for ground,i in @slope
      # Count the number of nearby trees, ice patches, and
      # ground patches on the current level.
      num_nearby_trees = 0
      num_nearby_ice = 0
      num_nearby_ground = 0

      num_nearby_trees++ if ground is SKI.rep.tree
      num_nearby_ice++ if ground is SKI.rep.ice
      num_nearby_ground++ if ground is SKI.rep.ground

      if i > 0
        num_nearby_trees++ if @slope[i - 1] is SKI.rep.tree
        num_nearby_ice++ if @slope[i - 1] is SKI.rep.ice
        num_nearby_ground++ if @slope[i - 1] is SKI.rep.ground

      if i < @slope.length - 1
        num_nearby_trees++ if @slope[i + 1] is SKI.rep.tree
        num_nearby_ice++ if @slope[i + 1] is SKI.rep.ice
        num_nearby_ground++ if @slope[i + 1] is SKI.rep.ground

      # Generate this character of the next level based upon
      # the characteristics of the nearby characters on the
      # current level.
      if SKI.percent(@prob_tree[num_nearby_trees]) and \
        ((i isnt @player_pos) or (num_nearby_trees > 0))
          tmp_slope[i] = SKI.rep.tree
      else if SKI.percent(@prob_ice[num_nearby_ice]) and \
        ((i isnt @player_pos) or (num_nearby_ice > 0))
          tmp_slope[i] = SKI.rep.ice
      else if SKI.percent(@prob_ground[num_nearby_ground]) and \
        ((i isnt @player_pos) or (num_nearby_ground > 0))
          tmp_slope[i] = SKI.rep.ice
      else
        tmp_slope[i] = SKI.rep.snow

    @slope = tmp_slope

  # Function: update_level(player) {{{2
  update_level: (player) ->
    # Go to the next level, and move the player.
    @level_num++

    # Figure out the new player position based on a modulo
    # addition.  Note that we must add the line length into the
    # expression before taking the modulus to make sure that we
    # are not taking the modulus of a negative integer.
    @player_pos = (@player_pos + player.player_speed + @slope.length) % @slope.length

    # Generate the updated slope.
    @gen_next_slope()

    # If there is no Yeti, one might be created.
    if not SKI.exists(@yeti) and SKI.percent(@prob_yeti_appearance)
      # Make sure that the Yeti does not appear too
      # close to the player.
      while (true)
        @yeti = @teleport();
        break unless @nearby(@yeti, SKI.min_yeti_appearance_distance)

      # Increase the initial appearance probabilities of all obstacles and
      # the Yeti.
      @prob_tree[0] *= SKI.level_multiplier
      @prob_ice[0] *= SKI.level_multiplier
      @prob_ground[0] *= SKI.level_multiplier
      @prob_yeti_appearance *= SKI.level_multiplier

  # Function: manipulate_objects(player) {{{2
  manipulate_objects: (player) ->
    # If there is a Yeti, the player's jet-powered skis may melt him,
    # or he may spontaneously melt. Otherwise move him towards the player.
    # If there is a tree in the way, the Yeti is blocked.
    if SKI.exists(@yeti)
      if (@nearby(@yeti) and SKI.percent(SKI.prob_skis_melt_yeti)) or SKI.percent(SKI.prob_yeti_melt)
        @yeti = null
        player.num_snomen_melted++
    # Ignored if the yeti melted above
    if SKI.exists(@yeti)
      if @yeti < @player_pos
        if @slope[@yeti + 1] != SKI.rep.tree
          @yeti += 1
      else
        if @slope[@yeti - 1] != SKI.rep.tree
          @yeti -= 1

    # If there is an ICBM, handle it.
    if SKI.exists(@icbm_pos)
      # If there is a Yeti, move the ICBM towards him.  Else,
      # self-destruct the ICBM.
      if SKI.exists(@yeti)
        if @icbm_pos < @yeti
          @icbm_pos += SKI.icbm_speed
        else
          @icbm_pos -= SKI.icbm_speed
      else
        @icbm_pos = null

    # If there is a fire demon on the level, handle it.
    if SKI.exists(@demon_pos)
      # If there is a Yeti on the current level, move the demon
      # towards him.  Else, the demon might decide to leave.
      if SKI.exists(@yeti)
        if @demon_pos < @yeti
          @demon_pos += SKI.demon_speed
        else
          @demon_pos -= SKI.demon_speed
      else
        if SKI.percent(25.0)
          @demon_pos = null

    # If there is a Yeti and an ICBM on the slope, the Yeti
    # might get melted.
    if SKI.exists(@yeti) and SKI.exists(@icbm_pos)
      if Math.abs(@yeti - @icbm_pos) <= SKI.icbm_range
        @icbm_pos = null
        @yeti = null
        player.num_snomen_melted += 1

    # If there is a Yeti and a fire demon, he might get melted.
    if SKI.exists(@yeti) and SKI.exists(@demon_pos)
      if Math.abs(@yeti - @demon_pos) <= 1
        @yeti = null
        player.num_snomen_melted += 1

  # Function: getPicture() {{{2
  getPicture: ->
    # Create a picture of the current level.
    picture = @slope[..]
    picture[@player_pos] = SKI.rep.player
    picture[@yeti] = SKI.rep.yeti if SKI.exists(@yeti)
    picture[@demon_pos] = SKI.rep.demon if SKI.exists(@demon_pos)
    picture[@icbm_pos] = SKI.rep.icbm if SKI.exists(@icbm_pos)
    picture

  # Function: toHTML() {{{2
  toHTML: ->
    html = for picture of @getPicture()
      SKI.colorize(picture) 
    html.join ','

  # Function: toString() {{{2
  toString: ->
    str = for picture of @getPicture()
      picture
    str.join ','
  # }}}2


# Class: SkiPlayer {{{1
class SKI.SkiPlayer
  # Class variables {{{2
  @injuries: [
    "However, you escaped injury!"
    "But you weren't hurt at all!"
    "But you only got a few scratches."
    "You received some cuts and bruises."
    "You wind up with a concussion and some contusions."
    "You now have a broken rib."
    "Your left arm has been fractured."
    "You suffered a broken ankle."
    "You have a broken arm and a broken leg."
    "You have four broken limbs and a cut!"
    "You broke every bone in your body!"
    "I'm sorry to tell you that you have been killed...."
  ]

  # Instance variables {{{2
  jump_count: -1
  num_snomen_melted: 0
  num_jumps_attempted: 0.0
  player_speed: 0
  meters_travelled: 0

  # Function: accident(msg, severity) {{{2
  accident: (msg, severity) ->
    # "accident()" is called when the player gets into an accident(),
    # which ends the game.  "msg" is the description of the accident()
    # type, and "severity" is the severity.  This function should never
    # return. Compute the degree of the player's injuries.
    degree = severity + SKI.random(0, SKI.injury_randomness - 1)

    # Print a message indicating the termination of the game.
    SKI.printPrompt "!"
    SKI.print "#{msg}  #{SkiPlayer.injuries[degree]}"
    
    # Print the statistics of the game.
    SKI.print "You skiied #{@meters_travelled} meters with
      #{@num_jumps_attempted} jumps and melted #{@num_snomen_melted}
      #{if @num_snomen_melted > 1 then 'Yetis' else 'Yeti'}."

    # Initially calculate the player's score based upon the number of
    # meters travelled.
    score = @meters_travelled * SKI.points_per_meter

    # Add bonus points for the number of jumps completed.
    score += @num_jumps_attempted * SKI.points_per_jump

    # Add bonus points for each Yeti that melted during the course of
    # the game.
    score += @num_snomen_melted * SKI.points_per_melted_yeti

    # Subtract a penalty for the degree of injury experienced by the
    # player.
    score += degree * SKI.points_per_injury_degree

    # Negative scores are just too silly.
    score = 0 if score < 0

    # Print the player's score.
    SKI.print "Your score for this run is #{score}."

    # Exit the game with a code indicating successful completion.
    SKI.exit()

  # Function: check_obstacles(world) {{{2
  check_obstacles: (world) ->
    # If we are just landing after a jump, we might fall down.
    if (@jump_count == 0) and SKI.percent(SKI.prob_bad_landing)
      return @accident("Whoops!  A bad landing!", SKI.light_injury)

    # If there is a tree in our position, we might hit it.
    if (world.terrain() is SKI.rep.tree) and SKI.percent(SKI.prob_hit_tree)
      return @accident("Oh no!  You hit a tree!", SKI.severe_injury)

    # If there is bare ground under us, we might fall down.
    if (world.terrain() is SKI.rep.ground) and SKI.percent(SKI.prob_fall_on_ground)
      return @accident("You fell on the ground!", SKI.moderate_injury)

    # If we are on ice, we might slip.
    if (world.terrain() is SKI.rep.ice) and SKI.percent(SKI.prob_slip_on_ice)
      return @accident("Oops!  You slipped on the ice!", SKI.slight_injury)

    # If there is a Yeti next to us, he may grab us.
    if world.nearby(world.yeti)
      return @accident("Yikes!  The Yeti's got you!", SKI.moderate_injury)

    true

  # Function: update_player() {{{2
  update_player: ->
    # Update state of player for current move.
    @meters_travelled += Math.abs(@player_speed) + 1
    # If the player was jumping, decrement the jump count.
    @jump_count -= 1 if @jump_count >= 0

  # Function: do_command(world, cmdline) {{{2
  do_command: (world, cmdline=" ") ->
    # Print a prompt, and read a command.  Return True to advance game.
    switch cmdline.charAt(0).toUpperCase()
      when '?'
        SKI.show_doc()
        return false
      when '!'
        SKI.console(cmdline.substring(1))
        return false
      when 'R'  # Move right
        if (world.terrain() isnt SKI.rep.ice) and (@player_speed < SKI.max_horizontal_player_speed)
          @player_speed += 1
          return true
      when 'L'  # Move left
        if (world.terrain() isnt SKI.rep.ice) and (@player_speed > -SKI.max_horizontal_player_speed)
          @player_speed -= 1
          return true
      when 'J'  # Jump
        @jump_count = SKI.random(0, 5) + 4
        @num_jumps_attempted += 1.0
        return true
      when 'H'  # Do a hop
        @jump_count = SKI.random(0, 2) + 2
        @num_jumps_attempted += 0.5
        return true
      when 'T'  # Attempt teleportation
        if SKI.percent(SKI.prob_bad_teleport)
          return @accident("You materialized 25 feet in the air!", SKI.slight_injury)
        world.player_pos = world.teleport()
        return true
      when 'I'  # Launch backpack ICBM
        if SKI.percent(SKI.prob_bad_icbm)
          return @accident("Nuclear blast in your backpack!", SKI.severe_injury)
        world.icbm_pos = world.player_pos
        return true
      when 'D'  # Incant spell for fire demon
        if SKI.percent(SKI.prob_bad_spell)
          return @accident("A bad spell -- the demon grabs you!", SKI.moderate_injury)
        world.demon_pos = world.teleport()
        return true
      else
        # Any other command just advances
        return true



# Main run loop {{{1
# These functions are public. Run state can be hacked. Play nice.
# Cheating seems silly.
SKI.run_state =
  repeat: 1
  end_game: false
  world: null
  player: null
  console: null
  ski_slope: null
  input: null

# Function: run_update(cmd) {{{2
SKI.run_update = (cmd) ->
  unless SKI.run_state.player.do_command(SKI.run_state.world, cmd)
    return false;
  SKI.run_state.world.manipulate_objects(SKI.run_state.player)
  SKI.run_state.world.update_level(SKI.run_state.player)
  SKI.run_state.player.update_player()

# Function: run_trigger() {{{2
SKI.run_trigger = ->
  # Disable field to prevent further input.
  SKI.run_state.input.attr("disabled","disabled")

  cmd = SKI.run_state.input.val()

  # Freeze former command.
  $(".ski-prompt-input:last").append(cmd)
    
  # Repeat logic
  if cmd > 0 # Check if number
    cmd = cmd * 1 # Convert to number
    for x in [0..cmd]
      SKI.run_update(null)
      return if SKI.run_state.end_game

      SKI.printSlope(SKI.run_state.world)

      return unless SKI.run_state.player.check_obstacles(SKI.run_state.world)
  else
    SKI.run_update(cmd)
    return if SKI.run_state.end_game

    SKI.printSlope(SKI.run_state.world)
        
    # If we are jumping, just finish the line.  Otherwise, check for
    # obstacles, and do a command.
    while SKI.run_state.player.jump_count >= 0
      SKI.run_update(null);
      return if SKI.run_state.end_game

      SKI.printSlope(SKI.run_state.world)
      # Don't check for obstacles till the end

    return unless SKI.run_state.player.check_obstacles(SKI.run_state.world)

  # Turn is done.
  SKI.printPrompt()
  SKI.printInputPrompt()

# Function: run() {{{2
SKI.run = (div) ->
  SKI.checkJQuery()

  unless SKI.exists(div)
    div = $(document.body)

    div.css("background-color", SKI.colordict['background'])

    SKI.run_state.repeat = 1
    SKI.run_state.end_game = false
    SKI.run_state.command = null
    SKI.run_state.loop_gaurd = 0
    SKI.run_state.world = new SKI.SkiWorld()
    SKI.run_state.player = new SKI.SkiPlayer()

    # Create the <pre/> for the text output.
    SKI.run_state.console = $("<tt id=\"ski-console\" />")
    # Create the <ol/> for the slope text.
    SKI.run_state.ski_slope = $("<ol id=\"ski-slope\" />")
    # Create the input text field.
    SKI.run_state.input = $("<input id=\"ski-input\" type=\"text\" size=\"3\" />")
    SKI.run_state.input.css("background-color", SKI.colordict['background'])
    SKI.run_state.input.keypress (event) ->
      if event.keyCode is "13"
        event.preventDefault()
        SKI.run_trigger()

    $(div).empty().append(SKI.run_state.console)

    SKI.print("SKI!  Version #{SKI.portVersion}. Type ? for help.")
    SKI.print("skiQuery port version #{SKI.version} by Devin Weaver")

    SKI.run_state.console.append(SKI.run_state.ski_slope)

    SKI.printSlope(SKI.run_state.world)
    SKI.printPrompt()
    SKI.printInputPrompt()
# }}}1

# vim:set et sw=2 ts=2 fdm=marker:
