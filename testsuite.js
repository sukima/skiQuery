module("Global Functions");
test("random()", function() {
    var result = SKI.random(1,10);
    ok(result >= 1 && result <= 10, "should return number between 1 and 10 for (1,10)");
    ok(SKI.random(1,1) == 1, "should return 1 for (1,1)");
});
test("percent()", function() {
    ok(SKI.percent(9999), "should return true for 9999");
});
test("exists()", function() {
    ok(!(SKI.exists), "Should not have this function defined. Deprecated!");
});
