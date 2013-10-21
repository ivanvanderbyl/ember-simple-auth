Ember.SimpleAuth.Session = Ember.Object.extend({
  init: function() {
    this._super();
    this.setProperties({
      authToken:       sessionStorage.authToken,
      refreshToken:    sessionStorage.refreshToken,
      authTokenExpiry: sessionStorage.authTokenExpiry
    });
  },
  setup: function(serverToken) {
    serverToken = serverToken || {};
    this.setProperties({
      authToken:       serverToken.access_token,
      refreshToken:    serverToken.refresh_token,
      authTokenExpiry: serverToken.expires_in || 0 * 1000
    });
  },
  destroy: function() {
    this.setProperties({
      authToken:       undefined,
      refreshToken:    undefined,
      authTokenExpiry: undefined
    });
  },
  isAuthenticated: Ember.computed('authToken', function() {
    return !Ember.isEmpty(this.get('authToken'));
  }),
  handlePropertyChange: function(property) {
    var value = this.get(property);
    if (Ember.isEmpty(value)) {
      delete sessionStorage[property];
    } else {
      sessionStorage[property] = value;
    }
  },
  authTokenObserver: Ember.observer(function() {
    this.handlePropertyChange('authToken');
  }, 'authToken'),
  refreshTokenObserver: Ember.observer(function() {
    this.handlePropertyChange('refreshToken');
    this.handleAuthTokenRefresh();
  }, 'refreshToken'),
  authTokenExpiryObserver: Ember.observer(function() {
    this.handlePropertyChange('authTokenExpiry');
    this.handleAuthTokenRefresh();
  }, 'authTokenExpiry'),
  handleAuthTokenRefresh: function() {
    Ember.run.cancel(this.get('refreshAuthTokenTimeout'));
    this.set('refreshAuthTokenTimeout', undefined);
    var waitTime = this.get('authTokenExpiry') - 5000;
    if (!Ember.isEmpty(this.get('refreshToken')) && waitTime > 0) {
      this.set('refreshAuthTokenTimeout', Ember.run.later(this, function() {
        var self = this;
        Ember.$.ajax(Ember.SimpleAuth.serverTokenRoute, {
          type:        'POST',
          data:        'grant_type=refresh_token&refresh_token=' + this.get('refreshToken'),
          contentType: 'application/x-www-form-urlencoded'
        }).then(function(response) {
          self.setup(response);
          self.handleAuthTokenRefresh();
        });
      }, this.get('authTokenExpiry') - 5000));
    }
  }
});
