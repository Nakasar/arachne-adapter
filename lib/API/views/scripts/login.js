

/**
 * Function to authenticate with ajax
 */
function submitLogin() {
    var username = document.getElementById('input-username').value;
    var password = document.getElementById('input-password').value;
    notifyUser({
        title: "Connecting ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/auth`,
        dataType: 'json',
        data: {
            username: username,
            password: password
        },
        success: (body) => {
            notifyUser({
                title: "Connected !",
                message: "",
                type:"success"
            });
            document.cookie = "token="+body.token;
            location.reload();
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: err.responseJSON.error,
                type:"error"
            });
        }
    });
}

$('#signin-form').submit(event => {
    event.preventDefault();
    submitLogin();
});