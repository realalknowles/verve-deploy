import run from './action.js'
import sinon from "sinon";
import core from '@actions/core'
import AWS from 'aws-sdk'
import _ from 'underscore'

describe('Deployer', () => {
    afterEach(() => sinon.restore())
    it('should deploy the lambda', function () {
        sinon.stub(core, 'getInput').callsFake(input => {
            return input
        })

        sinon.stub(AWS, 'STS').callsFake(properties => {
            return stubSts(properties);
        })

        sinon.stub(AWS, 'Lambda').callsFake(properties => {
            return stubLambda(properties)
        })

        run()
    })
})

function stubSts(properties) {
    if (_.isEqual(properties, {
        region: 'regions',
        credentials: {
            accessKeyId: 'access-key-id',
            secretAccessKey: 'secret-access-key'
        }
    })) {
        return stubAssumeRole();
    }
}

function stubAssumeRole() {
    return {
        assumeRole: properties => {
            if (_.isEqual(properties, {
                RoleArn: 'assume-role-arn',
                RoleSessionName: 'deploy-function-name-regions',
                DurationSeconds: 600
            })) {
                return stubResolveAssumeRole();
            }
        }
    }
}

function stubResolveAssumeRole() {
    return {
        promise: () => {
            return {
                Credentials: {
                    AccessKeyId: 'assumed-access-key-id',
                    SecretAccessKey: 'assumed-secret-access-key',
                    SessionToken: 'session-token'
                }
            }
        }
    }
}

function stubLambda(properties) {
    if (_.isEqual(properties, {
        maxRetries: 3,
        sslEnabled: true,
        logger: console,
        credentials: {
            accessKeyId: 'assumed-access-key-id',
            secretAccessKey: 'assumed-secret-access-key',
            sessionToken: 'session-token'
        }
    })) {
        return stubUpdateFunction();
    }
}

function stubUpdateFunction() {
    return {
        updateFunctionCode: properties => {
            if (properties.FunctionName === 'function-name' && !properties.Publish && properties.ZipFile) {
                return stubResolveUpdateFunction();
            }
        },
        updateFunctionConfiguration: properties => {
            if (_.isEqual(properties, {
                Handler: 'function.handler'
            })) {
                return stubResolveUpdateFunction();
            }
        }
    }
}

function stubResolveUpdateFunction() {
    return {
        promise: () => {
            return {
                outcome: 'success'
            }
        }
    }
}