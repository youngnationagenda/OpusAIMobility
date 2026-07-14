<?php
    include('config.php');

    if (isset($_SESSION[PRE_FIX . 'id'])) 
    {
        echo "<script>window.location='dashboard.php?p=restaurants'</script>"; 
    }
?>
<!DOCTYPE html>
<html lang="en">
    <head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="shortcut icon" href="assets/img/favicon.png">
        <link rel="stylesheet" href="assets/css/style.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet">
        <title>Login | Go Grab</title>
    </head>
    <body style="background-color: #084c3f !important;">

        <div class="page-container">
            <svg class="artwork artwork--desktop" viewBox="0 0 536 617" fill="none">
                <g>
              <defs>
                <rect id="SVGID_1_" width="536" height="617"></rect>
              </defs>
              <clipPath id="SVGID_2_">
                <use xlink:href="#SVGID_1_" overflow="visible"></use>
              </clipPath>
              <g clip-path="url(#SVGID_2_)">
                <path fill-rule="evenodd" clip-rule="evenodd" fill="#FFA781" d="M0,616.926V617h915V0H179.949l218.488,218.489L0,616.926z"></path>
                <g>
                  <path fill="#FFCB67" d="M712.79,218.83c0,173.59-140.72,314.32-314.31,314.32c-86.9,0-165.55-35.26-222.45-92.26l0.35-444.46
                    c56.86-56.79,135.38-91.91,222.1-91.91C572.07-95.48,712.79,45.24,712.79,218.83z"></path>
                </g>
                <path fill="#008060" d="M398.44,218.49l-222.41,222.4c-56.76-56.86-91.87-135.36-91.87-222.06c0-86.87,35.25-165.51,92.22-222.4
                  L398.44,218.49z"></path>
              </g>
            </g>
            </svg>
            <div class="login-page-conatiner">
                <div class="login-page-content">
                    <div class="login-card">
                        <div class="login-card-header">
                            <div class="login-card-logo">
                                <img src="assets/img/logo.png">
                            </div>
                        </div>
                        <div class="login-card-content">
                            <h1 class="ui-heading">Log in</h1>
                            <p class="ui-desc">Continue to Gograb</p>
                        </div>
                        <form method="post" action="process.php?action=login">
                            <div class="login--input" style="margin-bottom: 20px;">
                                <label for="email" data-spec="label-label">Email</label>
                                <input type="email" data-spec="input-field-input-element" aria-invalid="false" data-automation="authentication-email-field" name="email" value="" role="textbox" required>
                            </div>
                            <div class="login--input">
                                <label for="password" data-spec="label-label">Password</label>
                                <input type="password" data-spec="input-field-input-element" aria-invalid="false" data-automation="authentication-email-field" name="password" value="" role="textbox" required>
                            </div>
                            <button class="ui-submit-btn" type="submit">Submit</button>
                            <!-- <p class="help-link">
                                New to Tigerforce | Sales CRM?
                                <a href="#">Get started</a>
                            </p> -->
                        </form>
                       
                    </div>
                    <div class="login-footer">
                        <a href="#" class="login-footer-link">Help</a>
                        <a href="#" class="login-footer-link">Privacy</a>
                        <a href="#" class="login-footer-link">Terms</a>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>