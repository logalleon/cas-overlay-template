G_SERVER = '';
// Fires before ready (since it's a redirect)
if (top.frames.length === 0) {
  window.location.replace(G_SERVER + '/user-management?url=' + encodeURIComponent(window.location.href));
} else {
  jQuery("body").show();
}

// Ready
$(function() {
  var $form = $('#fm1');
  var $submit = $('.btn-submit[type="submit"]');
  $submit.closest('.row').prepend(
    '<div id="message" class="alert alert-error"><p></p></div>'
  );
  var $message = $('#message');
  $message.css({
    'background-color': '#f2dede',
    'color': '#a94442',
    'margin': '.5rem 0'
  }).hide();
  var credentialsWarning = 'Username or password is invalid.';
  $submit.on('click', function(e, tokenValidated) {
    if (!tokenValidated) {
      e.preventDefault();
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
          console.log(response);
          if (response.error) {
            $message.show().find('p').html(response.error.message);
          } else {
            //$(e.currentTarget).trigger('click', true);
          }
        }.bind(this),
        error: function(jqxhr, status, err) {
          if (jqxhr.status === 401) {
            $message.show().find('p').text(credentialsWarning)
          }
        }.bind(this),
        complete: function() {

        }.bind(this)
      });
    }
  });

  let $email2falink = $('#email2falink')
  $email2falink.on('click', function(e) {
    e.preventDefault();
    var data = {
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
        console.log(response);
        if (response.error) {
          $message.show().find('p').html(response.error.message);
        } else {
          //$(e.currentTarget).trigger('click', true);
        }
      }.bind(this),
      error: function(jqxhr, status, err) {
        if (jqxhr.status === 401) {
          $message.show().find('p').text(credentialsWarning)
        }
      }.bind(this),
      complete: function() {

      }.bind(this)
    });

  });
});


function enroll2fa() {
  let $form = $('#fm1');
  $('body').append('<form id="enroll2fa" method="post" action="' +
    G_SERVER + '/users/api/tfa/enable"><input type="hidden" id="enrollform-uid" name="uid"><input type="hidden" id="enrollform-password" name="password"></form>');
  let $helpform = $('#enroll2fa');
  $('#enrollform-uid').val($('#username').val());
  $('#enrollform-password').val($('#password').val());
  $helpform.submit();
}


