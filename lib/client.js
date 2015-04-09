
exports = module.exports = RecurlyApiClient;
exports.version = '1.0.0';

var crypto = require('crypto');
var request = require('superagent');
Q = require ( 'q' );
_ = require('lodash');

function RecurlyApiClient( apiKey, subdomain ) {
	this.apiKey = apiKey;
	this.subdomain = subdomain;
	this.urlRoot = 'https://' + this.subdomain + '.recurly.com/v2/';

	/**
	 * Generates the signature for a request. If the method is GET, then it does
	 * not need to add the body of the request to the signature. On the other
	 * hand, if it's either a POST, PUT or PATCH, the request body should be a
	 * JSON serialized object into a String. The resulting signature should be
	 * added as a GET parameter to the request.
	 *
	 * @param params - An associative array that contains GET params.
	 * @param method - Either GET, DELETE POST, PUT or PATCH
	 * @param apiPath - The path of the resource from the request.
	 * @param body - The contents of the request body. Used when doing a POST, PATCH or PUT requests. Defaults to "".
	 * @returns { string } - The signature that should be added as a query parameter to the URI of the request.
	 * @private
	 */
	this._generateSignature = function( method, apiPath, params, body ) {
		var shasum = crypto.createHash('sha256');
		shasum.update( this.apiKey );
		return shasum.digest('base64');
	};

	/**
	 * Generates the signature for a request. If the method is GET, then it does
	 * not need to add the body of the request to the signature. On the other
	 * hand, if it's either a POST, PUT or PATCH, the request body should be a
	 * JSON serialized object into a String. The resulting signature should be
	 * added as a GET parameter to the request.
	 *
	 * @param params - An associative array that contains GET params.
	 * @param method - Either GET, DELETE POST, PUT or PATCH
	 * @param apiPath - The path of the resource from the request.
	 * @param body - The contents of the request body. Used when doing a POST, PATCH or PUT requests.
	 * @returns { Promise } - A promise that will resolve to the requested data
	 * @private
	 */
	this._buildPromise = function( method, apiPath, params, body ) {
		var deferred = Q.defer();
		body = body || "";
		params = params || {};

		request[method.toLowerCase()]( this.urlRoot + apiPath )
			.accept('application/xml')
			.set('Authorization', this.apiKey )
			.query(params)
			.send(body)
			.end( function( err, res ) {
				if ( err ) {
					deferred.reject( new Error(error) );
				}

				if ( res.message ) {
					deferred.reject( new Error( res.message ) );
				} else {
					deferred.resolve(res.body);
				}
			});

		return deferred.promise;
	}
};

RecurlyApiClient.prototype.getAccount = function( accountId ) {
	return this._buildPromise("get", 'accounts/' + accountId );
};

RecurlyApiClient.prototype.createAccount = function( userId, email, firstName, lastName, orgName ) {
	var userInfo = {};
	userInfo['account_code'] = userId;
	userInfo['email'] = email;
	userInfo['first_name'] = firstName;
	userInfo['last_name'] = lastName;
	userInfo['company_name'] = orgName;
	return this._buildPromise("post", 'accounts', '', userInfo );
};

RecurlyApiClient.prototype.addBillingInfo = function( userId, address, billingInfo ) {
	var userInfo = {};
	userInfo['address'] = address;
	userInfo['billing_info'] = billingInfo;
	return this._buildPromise("post", 'accounts/' + userId, '', userInfo );
};

RecurlyApiClient.prototype.closeAccount = function( accountId ) {
	return this._buildPromise("delete", 'accounts/' + accountId );
};

RecurlyApiClient.prototype.reopenAccount = function( accountId ) {
	return this._buildPromise("put", 'accounts/' + accountId + '/reopen');
};
