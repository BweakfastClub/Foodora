const recipeRoutes = require("../../index");
const recipeModel = require("../../src/models/recipes_model");
const chai = require("chai"),
    chaiHttp = require("chai-http");
const should = chai.should();

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
                    console.log(res);
                    should.not.exist(err);
                    res.should.have.status(200);
                    done();
                });
        });
    });

    describe("/GET recipes by title", () => {
        it("the get recipes/search should get recipes", (done) => {
            chai.request(recipeRoutes).
                get("/recipes/search?keyword=reci").
                end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                    done();
                });
        });
    });


});

