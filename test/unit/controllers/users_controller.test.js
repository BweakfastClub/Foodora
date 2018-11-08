jest.mock('../../../src/models/users_model');
const usersModel = require('../../../src/models/users_model');
const usersController = require('../../../src/controllers/users_controller');


describe('create new users', () => {
  let status;
  let json;
  let res;
  const email = 'user@email.com';
  const name = 'user';
  const password = '1234';

  beforeEach((done) => {
    status = jest.fn(() => res);
    json = jest.fn(() => res);
    res = {
      json,
      status,
    };
    done();
  });

  it('calls store users', (done) => {
    usersModel.registerUser.mockImplementation((paramName, paramEmail, paramPassword, callback) => {
      expect(paramName).toEqual(name);
      expect(paramEmail).toEqual(email);
      expect(paramPassword).toEqual(password);
      callback();
    });
    usersController.register({ body: { name, email, password } }, res);
    done();
  });

  it('does not calls store users due to missing password', (done) => {
    usersController.register({ body: { name, email } }, res);
    expect(status.mock.calls[0]).toEqual([400]);
    expect(json.mock.calls[0]).toEqual([{
      error: 'Email, name and Password must be provided',
    }]);
    done();
  });

  it('does not calls store users due to missing email', (done) => {
    usersController.register({ body: { name, password } }, res);
    expect(status.mock.calls[0]).toEqual([400]);
    expect(json.mock.calls[0]).toEqual([{
      error: 'Email, name and Password must be provided',
    }]);
    done();
  });

  it('does not calls store users due to missing name', (done) => {
    usersController.register({ body: { password, email } }, res);
    expect(status.mock.calls[0]).toEqual([400]);
    expect(json.mock.calls[0]).toEqual([{
      error: 'Email, name and Password must be provided',
    }]);
    done();
  });
});
