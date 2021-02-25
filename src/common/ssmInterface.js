const AWS = require('aws-sdk');

const ssm = new AWS.SSM();

exports.upload = async (params, ssmParams) => {
    console.log('SSM Interface: UPLOADING');
    if (params.useSSM) {
        await AWS.config.update({region: params.region});
        for (const ssmParam of ssmParams) {
            await ssm.putParameter(ssmParam).promise();
        }
        console.log('SSM Interface: UPLOADED');
    } else {
        console.log('SSM Interface: UPLOAD SKIPPED');
    }
};

exports.download = async (paramName) => {
    console.log('SSM Interface: DOWNLOADING');
    try {
        const result = await ssm
            .getParameter({
                Name: paramName,
                WithDecryption: true
            })
            .promise();
        if (result) {
            return result.Parameter.Value;
        }
    } catch (error) {
        if (error.code === 'ParameterNotFound') {
            return false;
        }
        console.error(error);
    }
    throw 'Unhandled SSM Download Error: CHECK LOGS';
};
