/* global $ */
var G_SERVER = '';
// Fires before ready (since it's a redirect)
if (top.frames.length === 0 && $('.alert-danger').length === 0) {
  window.location.replace(G_SERVER + '/user-management?url=' + encodeURIComponent(window.location.href));
} else {
  $('body').show();
}


// Ready
$(function() {
  var $submit = $('.btn-submit[type="submit"]');
  $submit.closest('.row').prepend(
    '<div id="message" class="alert alert-success"><p></p></div>'
  );
  $submit.closest('.row').prepend(
    '<div id="errormessage" class="alert alert-error"><p></p></div>'
  );
  var $errormessage = $('#errormessage');
  $errormessage.css({
    'background-color': '#f2dede',
    'color': '#a94442',
    'margin': '.5rem 0'
  }).hide();
  var $message = $('#message');
  $message.css({
    'background-color': '#dff0d8',
    'border-color': '#d6e9c6',
    'color': '#3c763d',
    'margin': '.5rem 0'
  }).hide();
  var credentialsWarning = 'Username or password is invalid.';

  //load lazy registration
  $('body').append('<div class="lazy-registration-container" id="lazy-registration-container"></div>');
  $('#lazy-registration-container').load('/users/api/static/html/lazyregistration.html', function (){

    $('#register').on('click', function(e) {
      e.preventDefault();
      $('#lazyRegistration').show();
      $(window).scrollTop($('#lazyRegistration button[type="submit"]').offset().top);
    });

    $('#lazyRegForm').on('submit', function(e) {
      validateLazyRegForm(e);
    });

    $('#lazyRegUsername').on('blur', function (e){
      checkUsernameAvailability();
    });

    resizeFrame(true);

  });

  $submit.on('click', function(e, tokenValidated) {
    if (!tokenValidated) {
      e.preventDefault();
      $errormessage.hide();
      $message.hide();
      var data = {
        uid: $('#username').val(),
        password: $('#password').val(),
        token: $('#token').val()
      };
      $.ajax({
        url: G_SERVER + '/users/api/tfa/verify',
        method: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        crossOrigin: true,
        success: function(response) {
          if (response.error) {
            $errormessage.show().find('p').html(response.error.message);
            resizeFrame();
          } else {
            //send token with password field
            $('#password').val($('#password').val() + '<token>' + $('#token').val());
            $(e.currentTarget).trigger('click', true);
          }
        },
        error: function(jqxhr, status, err) {
          if (jqxhr.status === 401) {
            $errormessage.show().find('p').text(credentialsWarning);
          }
          resizeFrame();
        },
        complete: function() {

        }
      });
    }
  });

  let $email2falink = $('#email2falink');
  $email2falink.on('click', function(e) {
    e.preventDefault();
    $errormessage.hide();
    $message.hide();
    let data = {
      uid: $('#username').val(),
      password: $('#password').val(),
      token: $('#text').val()
    };
    $.ajax({
      url: G_SERVER + '/users/api/tfa/email-token',
      method: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      crossOrigin: true,
      success: function(response) {
        if (response.error) {
          $errormessage.show().find('p').html(response.error.message);
        } else {
          $message.show().find('p').html(response.message);
        }
        resizeFrame();
      },
      error: function(jqxhr, status, err) {
        if (jqxhr.status === 401) {
          $errormessage.show().find('p').text(credentialsWarning);
        }
        resizeFrame();
      },
      complete: function() {

      }
    });

  });


});

/**
 * Function that will be called from return message if use is not enrolled
 */
function enroll2fa() {  //eslint-disable-line
  $('body').append('<form id="enroll2fa" method="post" action="' +
    G_SERVER + '/users/api/tfa/enable"><input type="hidden" id="enrollform-uid" name="uid"><input type="hidden" id="enrollform-password" name="password"></form>');
  let $helpform = $('#enroll2fa');
  $('#enrollform-uid').val($('#username').val());
  $('#enrollform-password').val($('#password').val());
  $helpform.submit();
}


/**
 * Checks to see if a username already exists in the DB
 */
function checkUsernameAvailability() {
  let username = $('#lazyRegUsername').val();
  let data = {username:username};
  $.ajax({
    method: 'POST',
    url: '/users/api/check',
    data: data,
    success: displayUsernameAvailabilityMessage,
    error: function(jqxhr) {
      // silently fail . . .
    }
  });
}

/**
 * Callback for checkUsernameAvailability
 * @param {boolean} exists - status of the username availability
 */
function displayUsernameAvailabilityMessage(exists) {
  if (exists) {
    var msg = $('#template-user-exists').html();
    $('#lazyRegUsernameError').html(msg)
      .addClass('alert alert-danger col-lg-12');
  } else {
    $('#lazyRegUsernameError').html('')
      .removeClass('alert alert-danger col-lg-12');
  }
  resizeFrame();
}

/**
 * @param {Object:Event} e
 */
function validateLazyRegForm(e) {
  e.preventDefault();

  let valid = true;
  let username = $('#lazyRegUsername').val().trim();
  let email = $('#lazyRegEmail').val().trim();
  if (!username.length || !username.match(/[a-z]/gi)) {
    valid = false;
  }
  if (!email.length || !email.match(/[a-z]/gi)) {
    valid = false;
  }
  if (valid) {
    var data = $('#lazyRegForm').serialize();
    $.ajax({
      method: 'POST',
      url: '/users/api/lazyregistration',
      data: data,
      success: function(response) {
        if (response.error) {
          $('#lazyRegStatus p')
            .removeClass('alert-info')
            .addClass('alert alert-danger')
            .html(response.error.message);
          resizeFrame();
        } else {
          var html = $('#template-lazy-reg-success').html();
          $('#lazyRegStatus p').removeClass('alert-info').addClass('alert alert-success').html(html);
          $('#resendEmail').click(function(el) {
            el.preventDefault();
            resendEmail(response.email, response.hash);
          });
          resizeFrame();
         }
      },
      error: lazyRegError
    });
  }
}

/**
 * Resend the confirmation email to the email with the hash provided from the first call
 * @param {string} email - the user's email address
 * @param {string} hash - the hash link for the account
 */
function resendEmail(email, hash) {
  let url = '/users/api/lazyregistration-resend';
  let data = { email:email, hash:hash };
  $.ajax({
    method: 'POST',
    url: url,
    data: data,
    success: function(response) {
      var error = response.error === 'true' ? true : false;
      if (!error) {
        var html = $('#lazyRegStatus p').html();
        html += '<br>Another account confirmation email has been sent to the provided email address.';
        $('#lazyRegStatus p').html(html);
        $('#resendEmail').click(function(e) {
          e.preventDefault();
          resendEmail(email, hash);
        });
      }
      // Don't handle error, email error should have come through the first time
    },
    error: function(jqxhr) {
      // Silently fail . . .
    }
  });
}

/**
 * Updates the DOM to reflect a failure to register using lazy reg
 */
function lazyRegError(message) {
  $('#lazyRegStatus')
    .html($('#template-lazy-reg-fail').html())
    .find('p')
    .removeClass('alert-info')
    .addClass('alert alert-danger');
}

/**
 * resized the From in the top window. Needs to run on same servername  */
function resizeFrame(scrollToTop){
      //resize drupal iframe
    try {
      var newHeight = (document.body.scrollHeight + 200).toString();
      window.parent.document.getElementById('usermanagementframe').style.height = newHeight + 'px';
      document.body.style.background = 'none';
      top.history.replaceState({}, '', window.location.href);
      if (scrollToTop) {
        top.jQuery('html, body').animate({ scrollTop: 0 }, 300);
      }
    } catch (e) {
      console.log(e);
    }
}
