if (top.frames.length === 0){
  window.location.replace('https://eclkcdev.cleverex.com/user-management?url=' + encodeURIComponent(window.location.href) );
} else {
  jQuery("body").show();
}
