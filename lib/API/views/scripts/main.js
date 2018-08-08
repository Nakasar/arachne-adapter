

/**
 * 
 * @param hook
 * Function to delete a hook with ajax 
 */
function deleteHook(hook) {
    notifyUser({
        title: "Deleting ...",
        message: ""
    });
    $.ajax({
        method: 'DELETE',
        url: base_url + `/hooks/${escape(hook)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Deleted !",
                message: "Hook with id " + hook + " has been deleted",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't delete hook " + hook,
                type: "error"
            });
        }
    });
}

/**
 * 
 * @param admin function to delete an admin with ajax
 */
function deleteAdmin(admin) {
    notifyUser({
        title: "Deleting ...",
        message: ""
    });
    $.ajax({
        method: 'DELETE',
        url: base_url + `/admin/${escape(admin)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Deleted !",
                message: "Admin with id " + admin + " has been deleted",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't delete admin " + admin,
                type: "error"
            });
        }
    });
}

/**
 * Function to add an admin with ajax
 */
function addAdmin() {
    var admin = document.getElementById("nameAdmin").value;
    notifyUser({
        title: "Adding ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/admin/${escape(admin)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Added !",
                message: "Admin with name " + admin + " has been added",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't add admin " + admin,
                type: "error"
            });
        }
    });
}

/**
 * Funtion to modify the token with ajax
 */
function modifyToken() {
    var newToken = document.getElementById("newToken").value;
    notifyUser({
        title: "Modifying ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/token/${escape(newToken)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Modified !",
                message: "The token has been modified, new token : "+newToken,
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't modify token",
                type: "error"
            });
        }
    });
}

/**
 * Function to modify the url to the brain with ajax
 */
function modifyUrlBrain() {
    var newUrlBrain = document.getElementById("newUrlBrain").value;
    notifyUser({
        title: "Modifying ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/url`,
        data: {
            "newUrlBrain": newUrlBrain
        },
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Modified !",
                message: "The url to the brain has been modified, new url : "+newUrlBrain,
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't modify the url to the brain",
                type: "error"
            });
        }
    });
} 

/**
 * 
 * @param room 
 * Function to delete a black listed room with ajax 
 */
function deleteBlackListedRoom(room) {
    notifyUser({
        title: "Deleting ...",
        message: ""
    });
    $.ajax({
        method: 'DELETE',
        url: base_url + `/blacklistRooms/${escape(room)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Deleted !",
                message: "The room with id "+room+" has been deleted",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't delete room "+ room,
                type: "error"
            });
        }
    });
}

/**
 * 
 * @param cmd 
 * Function to delete a black listed cmd with ajax 
 */
function deleteBlackListedCmd(cmd) {
    notifyUser({
        title: "Deleting ...",
        message: ""
    });
    $.ajax({
        method: 'DELETE',
        url: base_url + `/blacklistCmds/${escape(cmd)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Deleted !",
                message: "The cmd with id "+cmd+" has been deleted",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't delete cmd "+ cmd,
                type: "error"
            });
        }
    });
}

/**
 * Function to add a black listed room with ajax
 */
function addBlackListedRoom() {
    var room = document.getElementById("nameRoom").value;
    notifyUser({
        title: "Adding ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/blacklistRooms/${escape(room)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Added !",
                message: "The room with name "+room+" has been added",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't add room "+ room,
                type: "error"
            });
        }
    });
}

/**
 * Function to add a black listed cmd with ajax
 */
function addBlackListedCmd() {
    var cmd = document.getElementById("nameCmd").value;
    notifyUser({
        title: "Adding ...",
        message: ""
    });
    $.ajax({
        method: 'POST',
        url: base_url + `/blacklistCmds/${escape(cmd)}`,
        dataType: 'json',
        success: () => {
            notifyUser({
                title: "Added !",
                message: "The cmd with name "+cmd+" has been added",
                type: "success"
            });
            setTimeout(() => {
                location.reload();
            },2000);
        },
        error: (err) => {
            notifyUser({
                title: "Error",
                message: "Couldn't add cmd "+ cmd,
                type: "error"
            });
        }
    });
}