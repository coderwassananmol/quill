angular.module('reg')
    .controller('ConfirmationCtrl', [
        '$scope',
        '$rootScope',
        '$state',
        'currentUser',
        'Utils',
        'UserService',
        function ($scope, $rootScope, $state, currentUser, Utils, UserService) {

            // Set up the user
            var user = currentUser.data;
            $scope.user = user;

            $scope.pastConfirmation = Date.now() > user.status.confirmBy;

            $scope.formatTime = Utils.formatTime;

            _setupForm();

            $scope.fileName = user._id + "_" + user.profile.name.split(" ").join("_");

            // -------------------------------
            // All this just for dietary restriction checkboxes fml


            // -------------------------------

            function _updateUser(e) {
                var confirmation = $scope.user.confirmation;
                var file = document.getElementById('resume').files[0];
                var fileName = file.name;
                console.log(file);
                var albumBucketName = 'hackcbs';
                var bucketRegion = 'us-east-2';
                var IdentityPoolId = 'us-east-2:ba44513d-0dea-4fd2-901a-3d8e06ac73d0';
                AWS.config.update({
                    region: bucketRegion,
                    credentials: new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: IdentityPoolId
                    })
                });
                var s3 = new AWS.S3({
                    apiVersion: '2006-03-01',
                    params: {Bucket: albumBucketName}
                });
                var params = {
                    Body: file,
                    Bucket: albumBucketName,
                    Key: user._id+fileName,
                };
                s3.putObject(params, function(err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else     console.log(data);           // successful response
                });
                UserService
                    .updateConfirmation(user._id, confirmation)
                    .success(function (data) {
                        sweetAlert({
                            title: "Woo!",
                            text: "You're confirmed!",
                            type: "success",
                            confirmButtonColor: "#e76482"
                        }, function () {
                            $state.go('app.dashboard');
                        });
                    })
                    .error(function (res) {
                        sweetAlert("Uh oh!", "Something went wrong.", "error");
                    });
            }

            function _setupForm() {
                // Semantic-UI form validation
                $('.ui.form').form({
                    inline: true,
                    fields: {
                        phone: {
                            identifier: 'phone',
                            rules: [
                                {
                                    type: 'regExp[/^[0-9]{10}$/]',
                                    prompt: 'Please enter a valid phone number'
                                }
                            ]
                        },
                        signaturePhotoRelease: {
                            identifier: 'signaturePhotoRelease',
                            rules: [
                                {
                                    type: 'empty',
                                    prompt: 'Please type your digital signature.'
                                }
                            ]
                        },
                        signatureCodeOfConduct: {
                            identifier: 'signatureCodeOfConduct',
                            rules: [
                                {
                                    type: 'empty',
                                    prompt: 'Please type your digital signature.'
                                },
                                {
                                    type: 'match[signaturePhotoRelease]',
                                    prompt: 'Signature doesn\'t match'
                                }
                            ]
                        },
                    }
                });
            }

            $scope.submitForm = function () {
                if ($('.ui.form').form('is valid')) {
                    _updateUser();
                }
            };

        }]);
