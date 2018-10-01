const recipeRoutes = require("../../index");
const recipeModel = require("../../src/models/recipes_model");
const chai = require("chai"),
    chaiHttp = require("chai-http");
const should = chai.should();
const {expect} = chai;

chai.use(chaiHttp);

describe("Endpoints exists for recipes", () => {
    before((done) => {
        recipeModel.setup(done);
    });

    after((done) => {
        recipeModel.clean(done);
    });

    describe("/GET recipes", () => {
        it("the get recipes endpoint should exist", (done) => {
            chai.request(recipeRoutes).
                get("/recipes").
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    done();
                });
        });
    });

    describe("/POST search/filter recipes", () => {
        it("should return a list of recipes with a keyword and caloric filter", (done) => {
            chai.request(recipeRoutes).
                post("/recipes/search").
                set("content-type", "application/json").
                send({
                    "query": {
                        "nutrition.calories.amount": {
                            "$lt": 500
                        }
                    }
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    for (const recipe of res.body) {
                        expect(recipe.nutrition.calories.amount).to.be.below(500);
                    }
                    done();
                });
        });

        it("should return a list of recipes with a keyword search", (done) => {
            chai.request(recipeRoutes).
                post("/recipes/search").
                set("content-type", "application/json").
                send({
                    "query": {
                        "$text": {
                            "$search": "pork"
                        }
                    }
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    done();
                });
        });

        it("should return a list of recipes with caloric filter", (done) => {
            chai.request(recipeRoutes).
                post("/recipes/search").
                set("content-type", "application/json").
                send({
                    "query": {
                        "nutrition.calories.amount": {
                            "$lt": 500
                        }
                    }
                }).
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    for (const recipe of res.body) {
                        expect(recipe.nutrition.calories.amount).to.be.below(500);
                    }
                    done();
                });
        });
    });

    describe("/GET recipes by Id", () => {
        it("get recipe by Id should return an existing recipe", (done) => {
            chai.request(recipeRoutes).
                get("/recipes/id/25449").
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    expect(res.body).to.not.be.empty;
                    expect(res.body.id).to.equal(25449);
                    done();
                });
        });
    });

});

