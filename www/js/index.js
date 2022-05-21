var ERROR = 'ERROR';

// Create or Open Database.
var db = window.openDatabase('FGW', '1.0', 'FGW', 20000);

// To detect whether users use mobile phones horizontally or vertically.
$(window).on('orientationchange', onOrientationChange);

// Display messages in the console.
function log(message, type = 'INFO') {
    console.log(`${new Date()} [${type}] ${message}`);
}

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        log('Portrait.');
    }
    else {
        log('Landscape.');
    }
}

// To detect whether users open applications on mobile phones or browsers.
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

// Display errors when executing SQL queries.
function transactionError(tx, error) {
    log(`SQL Error ${error.code}. Message: ${error.message}.`, ERROR);
}

// Run this function after starting the application.
function onDeviceReady() {
    log(`Device is ready.`);

    db.transaction(function (tx) {
        // Create table ACCOUNT.
        var query = `CREATE TABLE IF NOT EXISTS Account (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         Username TEXT NOT NULL UNIQUE,
                                                         Password TEXT NOT NULL)`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Account' successfully.`);
        }, transactionError);

        // Create table COMMENT.
        var query = `CREATE TABLE IF NOT EXISTS Comment (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         Comment TEXT NOT NULL,
                                                         Datetime DATE NOT NULL,
                                                         AccountId INTEGER NOT NULL,
                                                         FOREIGN KEY (AccountId) REFERENCES Account(Id))`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Comment' successfully.`);
        }, transactionError);

        // Create table RENTAL
        var query = `CREATE TABLE IF NOT EXISTS Rental (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         Rentalname TEXT NOT NULL UNIQUE,
                                                         Rentalprice TEXT NOT NULL,
                                                         Rentaladdress TEXT NOT NULL,
                                                         Rentalcity TEXT NOT NULL,
                                                         Rentaldistrict TEXT NOT NULL,
                                                         Rentalward TEXT NOT NULL,
                                                         Rentaltype TEXT NOT NULL,
                                                         Rentalfurniture TEXT NOT NULL,
                                                         Rentalbedroom TEXT NOT NULL,
                                                         Rentalreporter TEXT NOT NULL,
                                                         Rentaldate TEXT NOT NULL)`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Rental' successfully.`);
        }, transactionError);

        // Create table RENTAL COMMENT
        var query = `CREATE TABLE IF NOT EXISTS RComment (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         CommentR TEXT NOT NULL,
                                                         DatetimeR DATE NOT NULL,
                                                         RentalId INTEGER NOT NULL,
                                                         FOREIGN KEY (RentalId) REFERENCES Rental(Id))`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Rental Comment' successfully.`);
        }, transactionError);

    });

    prepareDatabase(db);
}

    // IMPORT RENTAL INFO
$(document).on('pagebeforeshow', '#page-create-rental', function () {
    importCity();
});

$(document).on('change', '#page-create-rental #frm-createrental #city', function () {
    importDistrict();
    importWard();
});

$(document).on('change', '#page-create-rental #frm-createrental #district', function () {
    importWard();
});

function importCity(selectedId = -1) {
    db.transaction(function (tx) {
        var query = `SELECT * FROM City ORDER BY NAME`;

        tx.executeSql(query, [], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select City</option>`;

            for (let city of result.rows) {

                optionList += `<option value='${city.Id}' ${city.Id == selectedId ? 'selected' : ''}>${city.Name}</option>`;
            }

            $('#page-create-rental #frm-createrental #city').html(optionList);
            $('#page-create-rental #frm-createrental #city').selectmenu('refresh', true)
        }
    });
}

function importDistrict(selectedId = -1) {
    
    var Cityid = $('#page-create-rental #frm-createrental #city').val();

    db.transaction(function (tx) {
        
        var query = `SELECT * FROM District WHERE CityId = ? ORDER BY NAME`;

        tx.executeSql(query, [Cityid], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select District</option>`;

            for (let district of result.rows) {
                optionList += `<option value='${district.Id}' ${district.Id == selectedId ? 'selected' : ''}>${district.Name}</option>`;
            }

            $('#page-create-rental #frm-createrental #district').html(optionList);
            $('#page-create-rental #frm-createrental #district').selectmenu('refresh', true)
        }
    });
}

function importWard(selectedId = -1) {
    
    var Districtid = $('#page-create-rental #frm-createrental #district').val();

    db.transaction(function (tx) {

        var query = `SELECT * FROM Ward WHERE DistrictId = ? ORDER BY NAME`;

        tx.executeSql(query, [Districtid], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select Ward</option>`;

            for (let ward of result.rows) {
                optionList += `<option value='${ward.Id}' ${ward.Id == selectedId ? 'selected' : ''}>${ward.Name}</option>`;
            }

            $('#page-create-rental #frm-createrental #ward').html(optionList);
            $('#page-create-rental #frm-createrental #ward').selectmenu('refresh', true)
        }
    });
}

// Submit a form to register a new account.
$(document).on('submit', '#page-home #frm-register-account', confirmAccount);
$(document).on('submit', '#page-home #frm-confirm', registerAccount);

function confirmAccount(e) {
    e.preventDefault();

    // Get user's input.
    var username = $('#page-home #frm-register-account #username').val();
    var password = $('#page-home #frm-register-account #password').val();
    var password_confirm = $('#page-home #frm-register-account #password-confirm').val();

    if (password != password_confirm) {
        var error = 'Password mismatch.';

        $('#page-home #error').empty().append(error);
        log(error, ERROR);
    }
    else {
        checkAccount(username, password);
    }
}

function checkAccount(username, password) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Account WHERE Username = ?';
        tx.executeSql(query, [username], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                log('Open the confirmation popup.');

                $('#page-home #error').empty();
                
                $('#page-home #frm-confirm #username').val(username);
                $('#page-home #frm-confirm #password').val(password);

                $('#page-home #frm-confirm').popup('open');
            }
            else {
                var error = 'Account exists.';
                $('#page-home #error').empty().append(error);
                log(error, ERROR);
            }
        }
    });
}

function registerAccount(e) {
    e.preventDefault();

    var username = $('#page-home #frm-confirm #username').val();
    var password = $('#page-home #frm-confirm #password').val();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Account (Username, Password) VALUES (?, ?)';
        tx.executeSql(query, [username, password], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Create a username '${username}' successfully.`);

            // Reset the form.
            $('#frm-register-account').trigger('reset');
            $('#page-home #error').empty();
            $('#username').focus();

            $('#page-home #frm-confirm').popup('close');
        }
    });
}

// Display Account List.
$(document).on('pagebeforeshow', '#page-list-account', showList);

function showList() {
    db.transaction(function (tx) { 
        var query = 'SELECT Id, Username FROM Account';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of accounts successfully.`);

            // Prepare the list of accounts.
            var listAccount = `<ul id='list-account' data-role='listview' data-filter='true' data-filter-placeholder='Search accounts...'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let account of result.rows) {
                listAccount += `<li><a data-details='{"Id" : ${account.Id}}'>
                                    <img src='img/reporter.png'>
                                    <h3>Username: ${account.Username}</h3>
                                    <p>ID: ${account.Id}</p>
                                </a></li>`;
            }
            listAccount += `</ul>`;

            // Add list to UI.
            $('#list-account').empty().append(listAccount).listview('refresh').trigger('create');

            log(`Show list of accounts successfully.`);
        }
    });
}

// Save Account Id.
$(document).on('vclick', '#list-account li a', function (e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem('currentAccountId', id);

    $.mobile.navigate('#page-detail-account', { transition: 'none' });
});

// Show Account Details.
$(document).on('pagebeforeshow', '#page-detail-account', showDetail);

function showDetail() {
    var id = localStorage.getItem('currentAccountId');

    db.transaction(function (tx) {
        var query = 'SELECT * FROM Account WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var errorMessage = 'Account not found.';
            var username = errorMessage;
            var password = errorMessage;

            if (result.rows[0] != null) {
                log(`Get details of account '${id}' successfully.`);
                
                username = result.rows[0].Username;
                password = result.rows[0].Password;
            }
            else {
                log(errorMessage, ERROR);

                $('#page-detail-account #btn-update').addClass('ui-disabled');
                $('#page-detail-account #btn-delete').addClass('ui-disabled');
            }

            $('#page-detail-account #id').val(id);
            $('#page-detail-account #username').val(username);
            $('#page-detail-account #password').val(password);
            
            showComment();
        }
    });
}

// Delete Account.
$(document).on('submit', '#page-detail-account #frm-delete', deleteAccount);
$(document).on('keyup', '#page-detail-account #frm-delete #txt-delete', confirmDeleteAccount);

function confirmDeleteAccount() {
    var text = $('#page-detail-account #frm-delete #txt-delete').val();

    if (text == 'confirm delete') {
        $('#page-detail-account #frm-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-detail-account #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteAccount(e) {
    e.preventDefault();

    var id = localStorage.getItem('currentAccountId');

    db.transaction(function (tx) {
        var query = 'DELETE FROM Account WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete account '${id}' successfully.`);

            $('#page-detail-account #frm-delete').trigger('reset');

            $.mobile.navigate('#page-list-account', { transition: 'none' });
        }
    });
}

// Add Comment.
$(document).on('submit', '#page-detail-account #frm-comment', addComment);

function addComment(e) {
    e.preventDefault();

    var accountId = localStorage.getItem('currentAccountId');
    var comment = $('#page-detail-account #frm-comment #txt-comment').val();
    var dateTime = new Date();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Comment (AccountId, Comment, Datetime) VALUES (?, ?, ?)';
        tx.executeSql(query, [accountId, comment, dateTime], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Add new comment to account '${accountId}' successfully.`);

            $('#page-detail-account #frm-comment').trigger('reset');

            showComment();
        }
    });
}

// Show Comment.
function showComment() {
    var accountId = localStorage.getItem('currentAccountId');

    db.transaction(function (tx) {
        var query = 'SELECT * FROM Comment WHERE AccountId = ?';
        tx.executeSql(query, [accountId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of comments successfully.`);

            // Prepare the list of comments.
            var listComment = '';
            for (let comment of result.rows) {
                listComment += `<div class = 'list'>
                                    <small>${comment.Datetime}</small>
                                    <h3>${comment.Comment}</h3>
                                </div>`;
            }
            
            // Add list to UI.
            $('#list-comment').empty().append(listComment);

            log(`Show list of comments successfully.`);
        }
    });
}




// Submit Form Create Rental
$(document).on('submit', '#page-create-rental #frm-createrental', CreateRental);
$(document).on('submit', '#page-create-rental #frm-confirm-rental', ConfirmRental);

function CreateRental(e) {
    e.preventDefault();
    
    // Get rental's input.
    var rentalname = $('#page-create-rental #frm-createrental #rentalname').val();
    var price = $('#page-create-rental #frm-createrental #price').val();
    var address = $('#page-create-rental #frm-createrental #address').val();
    var city = $('#page-create-rental #frm-createrental #city option:selected').text();
    var district = $('#page-create-rental #frm-createrental #district option:selected').text();
    var ward = $('#page-create-rental #frm-createrental #ward option:selected').text();
    var type = $('#page-create-rental #frm-createrental #type option:selected').text();
    var furniture = $('#page-create-rental #frm-createrental #furniture option:selected').text();
    var bedroom = $('#page-create-rental #frm-createrental #bedroom option:selected').text();
    var reporter = $('#page-create-rental #frm-createrental #reporter').val();
    var date = new Date();


    CheckRental(rentalname, price, address, city, district, ward, type, bedroom, reporter, date, furniture);
}

function CheckRental(rentalname, price, address, city, district, ward, type, bedroom, reporter, date, furniture) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Rental WHERE Rentaladdress = ?';
        tx.executeSql(query, [address], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                log('Open the confirmation popup.');

                $('#page-create-rental #error').empty();

                $('#page-create-rental #frm-confirm-rental #rentalname').val(rentalname);
                $('#page-create-rental #frm-confirm-rental #price').val(price);
                $('#page-create-rental #frm-confirm-rental #address').val(address);
                $('#page-create-rental #frm-confirm-rental #city').val(city);
                $('#page-create-rental #frm-confirm-rental #district').val(district);
                $('#page-create-rental #frm-confirm-rental #ward').val(ward);
                $('#page-create-rental #frm-confirm-rental #type').val(type);
                $('#page-create-rental #frm-confirm-rental #furniture').val(furniture);
                $('#page-create-rental #frm-confirm-rental #bedroom').val(bedroom);
                $('#page-create-rental #frm-confirm-rental #reporter').val(reporter);
            
                $('#page-create-rental #frm-confirm-rental').popup('open');
            }
            else {

                $('#page-create-rental #frm-error').popup('open');
                
            }
        }
    });
}

function ConfirmRental(e) {
    e.preventDefault();

    var rentalname = $('#page-create-rental #frm-createrental #rentalname').val();
    var price = $('#page-create-rental #frm-createrental #price').val();
    var address = $('#page-create-rental #frm-createrental #address').val();
    var city = $('#page-create-rental #frm-createrental #city option:selected').text();
    var district = $('#page-create-rental #frm-createrental #district option:selected').text();
    var ward = $('#page-create-rental #frm-createrental #ward option:selected').text();
    var type = $('#page-create-rental #frm-createrental #type option:selected').text();
    var furniture = $('#page-create-rental #frm-createrental #furniture option:selected').text();
    var bedroom = $('#page-create-rental #frm-createrental #bedroom option:selected').text();
    var reporter = $('#page-create-rental #frm-createrental #reporter').val();
    var date = new Date();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Rental (Rentalname, Rentalprice, Rentaladdress, Rentalcity, Rentaldistrict, Rentalward, Rentaltype, Rentalbedroom, Rentalreporter, Rentaldate, Rentalfurniture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        tx.executeSql(query, [rentalname, price, address, city, district, ward, type, bedroom, reporter, date, furniture], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Create a rental '${rentalname}' successfully.`);

            // Reset the form.
            $('#frm-createrental').trigger('reset');
            $('#page-create-rental #error').empty();
            $('#rentalname').focus();

            $('#page-create-rental #frm-confirm-rental').popup('close');
        }
    });
}

// Display Rental List.
$(document).on('pagebeforeshow', '#page-rental', showListR);

function showListR() {
    db.transaction(function (tx) {
        var query = 'SELECT Id, Rentalname, Rentalreporter, Rentalprice, Rentalcity, Rentalward, Rentaldistrict, Rentaltype FROM Rental';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of rentals successfully.`);

            // Prepare the list of accounts.
            var listRental = `<ul id='list-rental' data-role='listview' data-filter='true' data-filter-placeholder='Search rentals...'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let rental of result.rows) {
                listRental += `<li><a data-details='{"Id" : ${rental.Id}}'>
                                    <img src='img/rental.png'>
                                    <h3>Rental: ${rental.Rentalname} ${rental.Rentaltype}</h3>
                                    <p>${rental.Rentalward},${rental.Rentaldistrict},${rental.Rentalcity}</p>
                                    <p>Price: ${rental.Rentalprice} VND/Month</p>
                                    <p><small>Reporter: ${rental.Rentalreporter}</small></p>
                                </a></li>`;
            }
            listRental += `</ul>`;

            // Add list to UI.
            $('#list-rental').empty().append(listRental).listview('refresh').trigger('create');

            log(`Show list of rentals successfully.`);
        }
    });
}

// Save Rental Id.
$(document).on('vclick', '#list-rental li a', function (e) {
    e.preventDefault();

    var idr = $(this).data('details').Id;
    localStorage.setItem('currentRentalId', idr);

    $.mobile.navigate('#page-detail-rental', { transition: 'none' });
});

// Show Rental Details.
$(document).on('pagebeforeshow', '#page-detail-rental', showDetailR);

function showDetailR() {
    var idr = localStorage.getItem('currentRentalId');

    db.transaction(function (tx) {
        var query = 'SELECT * FROM Rental WHERE Id = ?';
        tx.executeSql(query, [idr], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var errorMessage = 'Rental not found.';
            var rentalname = errorMessage;
            var price = errorMessage;
            var address = errorMessage;
            var city = errorMessage;
            var district = errorMessage;
            var ward = errorMessage;
            var type = errorMessage;
            var bedroom = errorMessage;
            var reporter = errorMessage;
            var date = errorMessage;
            var furniture = errorMessage;

            if (result.rows[0] != null) {
                log(`Get details of rental '${idr}' successfully.`);

                rentalname = result.rows[0].Rentalname;
                price = result.rows[0].Rentalprice;
                address = result.rows[0].Rentaladdress;
                city = result.rows[0].Rentalcity;
                district = result.rows[0].Rentaldistrict;
                ward = result.rows[0].Rentalward;
                type = result.rows[0].Rentaltype;
                furniture = result.rows[0].Rentalfurniture;
                bedroom = result.rows[0].Rentalbedroom;
                reporter = result.rows[0].Rentalreporter;
                date = result.rows[0].Rentaldate;   
            }
            else {
                log(errorMessage, ERROR);

                $('#page-detail-rental #btn-update-rental').addClass('ui-disabled');
                $('#page-detail-rental #btn-delete-rental').addClass('ui-disabled');
            }

            $('#page-detail-rental #idr').val(idr);
            $('#page-detail-rental #rentalname').val(rentalname);
            $('#page-detail-rental #price').val(price);
            $('#page-detail-rental #address').val(address);
            $('#page-detail-rental #city').val(city);
            $('#page-detail-rental #district').val(district);
            $('#page-detail-rental #ward').val(ward);
            $('#page-detail-rental #type').val(type);
            $('#page-detail-rental #furniture').val(furniture);
            $('#page-detail-rental #bedroom').val(bedroom);
            $('#page-detail-rental #reporter').val(reporter);
            $('#page-detail-rental #date').val(date);

            showComment();
        }
    });
}

// Delete Rental.
$(document).on('submit', '#page-detail-rental #frm-delete-rental', deleteRental);
$(document).on('keyup', '#page-detail-rental #frm-delete-rental #txt-delete-rental', confirmDeleteRental);

function confirmDeleteRental() {
    var text = $('#page-detail-rental #frm-delete-rental #txt-delete-rental').val();

    if (text == 'confirm delete') {
        $('#page-detail-rental #frm-delete-rental #btn-delete-rental').removeClass('ui-disabled');
    }
    else {
        $('#page-detail-rental #frm-delete-rental #btn-delete-rental').addClass('ui-disabled');
    }
}

function deleteRental(e) {
    e.preventDefault();

    var idr = localStorage.getItem('currentRentalId');

    db.transaction(function (tx) {
        var query = 'DELETE FROM Rental WHERE Id = ?';
        tx.executeSql(query, [idr], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete rental '${idr}' successfully.`);

            $('#page-detail-rental #frm-delete-rental').trigger('reset');

            $.mobile.navigate('#page-list-rental', { transition: 'none' });
        }
    });
}


    // Add Comment Rental.
$(document).on('submit', '#page-detail-rental #frm-comment-rental', addCommentR);

function addCommentR(e) {
    e.preventDefault();

    var rentalId = localStorage.getItem('currentRentalId');
    var commentr = $('#page-detail-rental #frm-comment-rental #txt-comment-rental').val();
    var dateTimer = new Date();

    db.transaction(function (tx) {
        var query = 'INSERT INTO RComment (RentalId, CommentR, DatetimeR) VALUES (?, ?, ?)';
        tx.executeSql(query, [rentalId, commentr, dateTimer], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Add new comment to account '${rentalId}' successfully.`);

            $('#page-detail-rental #frm-comment-rental').trigger('reset');

            showCommentR();
        }
    });
    // Show Comment Rental.
    function showCommentR() {
        var rentalId = localStorage.getItem('currentRentalId');

        db.transaction(function (tx) {
            var query = 'SELECT * FROM RComment WHERE RentalId = ?';
            tx.executeSql(query, [rentalId], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                log(`Get list of comments successfully.`);

                // Prepare the list of comments.
                var listCommentR = '';
                for (let commentr of result.rows) {
                    listCommentR += `<div class = 'list'>
                                    <small>${commentr.DatetimeR}</small>
                                    <h3>${commentr.CommentR}</h3>
                                </div>`;
                }

                // Add list to UI.
                $('#list-comment-rental').empty().append(listCommentR);

                log(`Show list of comments successfully.`);
            }
        });
    }
}


