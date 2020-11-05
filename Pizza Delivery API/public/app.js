/*
* Frontend Logic for the Application
*
*/
var app = {}

app.config = {
    'sessionToken': false,
};

app.client = {}

app.client.request = function(headers, path, method, queryStringObject, payload, callback){

    headers = typeof(headers) == 'object' && headers !== 'null' ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== 'null' ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== 'null' ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;

    var requestUrl = path+'?';
    var counter = 0
    for(var keyQuery in queryStringObject){
        if(queryStringObject.hasOwnProperty(keyQuery)){
            counter++
            if(counter > 1){
                requestUrl+='&'
            }
            requestUrl+=keyQuery+'='+queryStringObject[keyQuery];
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    for(var keyHeader in headers){
        if(headers.hasOwnProperty(keyHeader)){
            xhr.setRequestHeader(keyHeader, headers[keyHeader]);
        }
    }

    if(app.config.sessionToken){
        xhr.setRequestHeader('token_id', app.config.sessionToken.token_id);
    }

    xhr.onreadystatechange = function(){
        if(xhr.readyState == XMLHttpRequest.DONE){
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;

            if(callback){
                try{
                    var parsedResponse = JSON.parse(responseReturned)
                    callback(statusCode, parsedResponse)
                } catch(e){
                    callback(statusCode, false)
                }
            }
        }
    };


    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString)

}

// Bind the logout button
app.bindLogoutButton = function(){
    document.getElementById('logoutButton').addEventListener('click', function(e){
        e.preventDefault()

        app.logCustomerOut()
    });
    
};

// Log the customer out then redirect them
app.logCustomerOut = function(){
    // Get the current token in
    var token_id = typeof(app.config.sessionToken.token_id) == 'string' ? app.config.sessionToken.token_id : false;

    // Send the current token to the tokens endpoint to delete it
    var queryStringObject = {
        'token_id': token_id,
    }
    

    app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, function(statusCode, responsePayload){
        // set the app.config token as false
        app.setSessionToken(false);
        
        // Send the customer to the logged out page
        window.location = '/session/deleted';



    })

};

// Bind the forms
app.bindForms = function(){   
    if(document.querySelector("form")){

        var allForms = document.querySelectorAll("form");
        for(var i = 0; i < allForms.length; i++){
            allForms[i].addEventListener("submit", function(e){

            // Stop it from submiting
            e.preventDefault();
            var formId = this.id
            var path = this.action
            var method = this.method.toUpperCase();

            // Hide the error message (if it's currently shown due to a previous error)
            document.querySelector('#'+formId+' .formError').style.display = 'none'

            // Hide the success message (if it's currently shown due to a previous error)
            if(document.querySelector("#"+formId+" .formSuccess")){
                document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
            }

            // Turn the inputs into a payload
            var payload = {}
            var elements = this.elements;
            for(var i = 0; i < elements.length; i++){
                if(elements[i].type !== 'submit'){
                    var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                    if(elements[i].name == '_method'){
                        method = valueOfElement;
                    } else{
                        payload[elements[i].name] = valueOfElement
                    }
                }
            }

            // Call the API
            app.client.request(undefined, path, method, undefined, payload, function(statusCode, responsePayload){
                if(statusCode !== 200){

                    if(statusCode == 403){
                        console.log(responsePayload)
                    } else{
                        var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An erroir has occured, please try again';


                        document.querySelector('#'+formId+' .formError').innerHTML = error
                        document.querySelector('#'+formId+' .formError').style.display = 'flex'
                        
                    }
                    
                } else{
                    app.formResponseProcessor(formId, payload, responsePayload)
                }
            });
        });
        };
    };
};

// Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload){
    var functionToCall = false;

    if(formId == 'customerCreate'){

        // Take the email, and use it to log the user in
        var newPayload = {
            'email_address': requestPayload.email_address,
            'password': requestPayload.password
        };

        app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, function(newStatusCode, newResponsePayload){
            // Display an error on the form if needed
            if(newStatusCode !== 200){

                document.querySelector('#'+formId+' .formError').innerHTML = 'Sorry, an error occured. Please try again'
                document.querySelector('#'+formId+' .formError').style.display = 'flex'
            } else{
                // if successful, se the token and redirect the user
                app.setSessionToken(newResponsePayload);
                window.location = '/menu/pizza'
            }
        });
    }

    // If login was successful, set the token in localstorage and redirest the user
    if(formId == 'sessionCreate'){
        app.setSessionToken(responsePayload);
        window.location = '/menu/pizza'
    }

    // If forms saved successfully and they have success messages, show them
    var formsWithSuccessMessages = ['customerEdit'];
    if(formsWithSuccessMessages.indexOf(formId) > -1){
        document.querySelector('#'+formId+" .formSuccess").style.display = 'flex'

    }
};

// Get the session token from localstrorage and set it in the app.config object
app.getSessionToken = function(){
    var tokenString = localStorage.getItem('token');
    if(typeof(tokenString) == 'string'){
        try{
            var token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if(typeof(token) == 'object'){
                app.setLoggedInClass(true);
                app.shoppingCartItems(token.email_address)
            } else{
                app.setLoggedInClass(false);
            }

        } catch(e){
            app.config.sessionToken = false;
            app.setLoggedInClass(false)
        }
    }
}

app.shoppingCartItems = function(email_address){

    var queryStringObject = {
        'email_address': email_address
    }

    app.client.request(undefined, 'api/customers', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
        if(statusCode == 200){
            var shoppingCartLength = responsePayload.shopping_cart.length;
            document.querySelector('.navbar .right .shopping-cart').innerHTML = `<i class="fas fa-shopping-basket"></i><span>${shoppingCartLength}</span>`
        } else{
            
        }

        
    })    
}

app.setLoggedInClass = function(add){
    var target = document.querySelector("body");
    if(add){
        target.classList.add('loggedIn');
    } else{
        target.classList.remove('loggedIn')
    }

    if(document.body.classList.contains('loggedIn')){
        document.querySelector('.right a.account').href = '/customer/edit'
    } 
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token', tokenString);
    if(typeof(token) == 'object'){
        app.setLoggedInClass(true)
    } else{
        app.setLoggedInClass(false)
    }
}


// Renew the token
app.renewToken = function(callback){
    var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
    if(currentToken){
        // Update the token with new expiration
        var payload = {
            'token_id': currentToken.token_id,
            'extend': true
        };

        app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function(statusCode, responsePayload){
            if(statusCode == 200){

                // Get the new token details
                var queryStringObject = {'token_id': currentToken.token_id};
                app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
                    if(statusCode == 200){
                        app.setSessionToken(responsePayload);
                        callback(false)
                    }
                    else{
                        app.setSessionToken(false)
                        callback(true)
                    }
                })
            } else{
                app.setSessionToken(false);
                callback(true);
            }
        })
    } else {
        app.setSessionToken(false);
        callback(true);
    }
};

// Load data on the page
app.loadDataOnPage = function(){
    var bodyClasses = document.querySelector("body").classList;
    var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

    if(primaryClass == 'customerEdit'){
        app.loadCustomerEditPage();
    }
};

app.loadCustomerEditPage = function(){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;

    if(email_address){

        var queryStringObject = {
            'email_address':email_address
        }

        app.client.request(undefined, 'api/customers', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
            if(statusCode == 200){
                document.querySelector('#customerEdit .firstNameInput').value = responsePayload.first_name;
                document.querySelector('#customerEdit .lastNameInput').value = responsePayload.last_name;
                document.querySelector('#customerEdit .streetAddressInput').value = responsePayload.street_address;
                document.querySelector('#customerEdit .zipCodeInput').value = responsePayload.zip_code;
                document.querySelector('#customerEdit .displayEmailInput').value = responsePayload.email_address;

                document.querySelector("#customerEdit .hiddenEmailInput").value = responsePayload.email_address;

            } else{
                app.logCustomerOut()
            }
        })
    } else{
        app.logCustomerOut()
    }
}



// Loop to renew token ofter
app.tokenRenewalLoop = function(){
    setInterval(function(){
        app.renewToken(function(err){
            if(!err){
                console.log("Token renewed successfully @ "+Date.now())
            }
        });
    }, 1000*60);
};

app.bindAddToCart = function(element){
    var addButton = element.querySelectorAll('.add-to-cart')
    var deleteButton = element.querySelectorAll('.remove-from-cart')
    addButton.forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault()

            app.addToTheCart(btn, 'add')
        })
    })
    deleteButton.forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault()

            app.addToTheCart(btn, 'delete')
        })
    })
};

app.addToTheCart = function(btn, use){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;

    if(email_address){
        var payload = {
            'email_address': email_address,
            'addOrDelete': use,
            'item': btn.id
        };
        var queryStringObject = {
            'item_id': btn.name
        }

        app.client.request(undefined, 'api/shopping-cart', 'PUT', queryStringObject, payload, function(statusCode, responsePayload){
            if(statusCode == 200){
                console.log(responsePayload)
                app.shoppingCartItems(email_address)
                window.location = '/customer/shopping-cart'
            } else{
                console.log(statusCode)
            }
        })
    } else{ 
        app.logCustomerOut()
    }
}

app.renderMenuItems = function(){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;
    var menuListSection = document.querySelector('section .menu-cards');

    if(email_address){

        var queryStringObject = {
            'email_address': email_address,
        }

        app.client.request(undefined, 'api/menu', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
            if(statusCode == 200){

                if(window.location.pathname == '/menu/pizza'){

                    responsePayload.forEach(function(pizza){

                        var menuCard = document.createElement('div')
                        menuCard.classList.add('menu-card')

                        menuCard.innerHTML = `
                                <div class="card-image">
                                    <img src="${pizza.image}" alt="${pizza.name}">
                                </div>
                                <div class="card-shopping-details">
                                    <p class="price">${pizza.price}<span>${pizza.currency}</span></p>
                                    <button type="submit" id="${pizza.name}" class="add-to-cart"><i class="fas fa-shopping-basket"></i></button>
                                </div>
                                <div class="card-goods-details">
                                    <h3>${pizza.name}</h3>
                                    <div class="underline"></div>
                                    <div class="ingredients">
                                    </div>
                                </div>
                                    `

                        var ingredientsDiv = menuCard.querySelector('.ingredients')

                        for(var i = 0; i < pizza.ingredients.length; i++){
                            var ingre = document.createElement('div')
                            ingre.classList.add('ingre')
                            ingre.innerHTML = `${pizza.ingredients[i]}`
                            ingredientsDiv.appendChild(ingre)
                            
                        }

                        menuListSection.appendChild(menuCard)
                    })
                    app.bindAddToCart(menuListSection)
                } else{
                    return
                }

            } else{
                console.log(statusCode, responsePayload)
            }
        })

    } else if(email_address == false && window.location.pathname == '/menu/pizza'){
        var infoCard = document.createElement('div')
        infoCard.classList.add('info-card')
        infoCard.innerHTML = `
            <div class="text">
                <p>In order to see our menu, you must to create an account</p>
            </div>
            <div class="button-container">
                <a href="/customer/create" class="button">Create an Account</a>
            </div>

        `

        menuListSection.appendChild(infoCard)
        app.bindAddToCart(menuListSection)

    } else{
        return
    }
}

app.renderShoppingCartItems = function(){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;
    var shoppingCartSection = document.querySelector('section.shoppingCart-container');

    if(email_address){
        var queryStringObject = {
            "email_address": email_address
        };

        app.client.request(undefined, 'api/shopping-cart', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
            if(statusCode == 200){
                if(window.location.pathname == '/customer/shopping-cart'){
                    var totalPrice = 0

                    responsePayload.forEach(function(item){
                        
                        var shoppingCartItem = document.createElement('div')
                        shoppingCartItem.classList.add(`shoppingCart-item`)
                        shoppingCartItem.innerHTML = `
                            <div class="image">
                                <img src="${item.image}" alt="${item.name}">
                            </div>
                            <div class="pizza-details">
                                <p class="pizza-name">${item.name}</p>
                                <p class="ingredients">${item.ingredients}</p>
                            </div>
                            <div class="amount">1 ks</div>
                            <div class="add-or-delete-container">
                                <button type="submit" id="${item.name}" class="add-to-cart"><i class="fas fa-shopping-basket"></i></button>
                                <button type="submit" id="${item.name}" name="${item.item_id}" class="remove-from-cart"><i class="fas fa-trash-alt"></i></button>
                            </div>
                            <div class="price">
                                <p>${item.price} ${item.currency}</p>
                            </div>`
                        totalPrice+= item.price
                    shoppingCartSection.firstElementChild.appendChild(shoppingCartItem)
                    })

                    if(responsePayload.length > 0){
                        var shoppingCartDetails = document.createElement('div')
                        shoppingCartDetails.classList.add('shoppingCart-details')
                        shoppingCartDetails.innerHTML = `
                        <div class="order-details">
                            <h3>Total Amount: <span>${responsePayload.length} ks</span></h3>
                            <h3>Total Price: <span>${totalPrice} CZK</span></h3>
                        </div>
                        <div class="button-container">
                            <a href="customer/checkout" class="button" >Make an Order</a>
                        </div>`
                        shoppingCartSection.appendChild(shoppingCartDetails)
                    } else{
                        var infoCard = document.createElement('div')
                        infoCard.classList.add('info-card')
                        infoCard.innerHTML = `
                            <div class="text">
                                <p>Your shopping cart is empty</p>
                            </div>
                            <div class="button-container">
                                <a href="menu/pizza" class="button">Go to Menu</a>
                            </div>
                
                        `
                        shoppingCartSection.appendChild(infoCard)
                    }
                    app.bindAddToCart(shoppingCartSection)
                    app.renderCheckoutItems(responsePayload)
                } else{
                    app.renderCheckoutItems(responsePayload)
                    
                }
            } else{
                console.log(statusCode, responsePayload)
            }
        })


    } else if(email_address == false && window.location.pathname == '/customer/shopping-cart'){
        var infoCard = document.createElement('div')
        infoCard.classList.add('info-card')
        infoCard.innerHTML = `
            <div class="text">
                <p>In order to add items to your cart, you must to create an account</p>
            </div>
            <div class="button-container">
                <a href="/customer/create" class="button">Create an Account</a>
            </div>

        `

        shoppingCartSection.appendChild(infoCard)
    } else{
        return
    }
};

app.renderCheckoutItems = function(responsePayload){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;
    var checkoutSection = document.querySelector('section.checkout-container')

    if(email_address){
        if(window.location.pathname == '/customer/checkout'){
            var formWrapper = document.createElement('div')
            formWrapper.classList.add('formWrapper')
            formWrapper.innerHTML = `
            <form id="customerCheckout" action="/api/orders" method="POST">
                <div class="formError"></div>
        
                <div class="formInput">
                    <label for="email_address">Email Address</label>
                    <input type="email" class="disabled" name="email_address" value="${email_address}" disabled>
                </div>

                <div class="formInput checkboxInput">
                    <label for="agreement">Do you agree to the terms and conditions?</label>
                    <input type="checkbox" name="agreement" value="agree" checked disabled>
                </div>
                <p class="attention">*This is only testing, we do not need your card information</p>
                <div class="formInput button-container">
                    <button class="button" type="submit">Make an Order</button>
                </div>
        
            </form>`

            checkoutSection.firstElementChild.appendChild(formWrapper)

            var checkoutOrderDetails = document.createElement('div')
            checkoutOrderDetails.classList.add('checkout-order-details')
            var totalPrice = 0

            responsePayload.forEach(function(item){
                var orderedItem = document.createElement('div')
                orderedItem.classList.add('item')
                orderedItem.innerHTML = `
                <div class="image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="pizza-details">
                    <p class="pizza-name">${item.name}</p>
                    <p class="price">${item.price} ${item.currency}</p>
                </div>
                <div class="amount">
                    <p>1 ks</p>
                </div>`
                totalPrice += item.price
                checkoutOrderDetails.appendChild(orderedItem)
            })
            checkoutSection.firstElementChild.appendChild(checkoutOrderDetails)

            if(responsePayload.length > 0){
                var checkoutTotal = document.createElement('div')
                checkoutTotal.classList.add('total');
                checkoutTotal.innerHTML = `     
                <p class="total-items">Total Amount: ${responsePayload.length} ks</p>       
                <p class="total-price">Total Price: ${totalPrice} czk</p>
                `
                checkoutSection.firstElementChild.appendChild(checkoutTotal)

            } else{
                var infoCard = document.createElement('div')
                infoCard.classList.add('info-card')
                infoCard.innerHTML = `
                    <div class="text">
                        <p>Your shopping cart is empty</p>
                    </div>
                    <div class="button-container">
                        <a href="menu/pizza" class="button">Go to Menu</a>
                    </div>
        
                `
                checkoutSection.firstElementChild.appendChild(infoCard)
            }
            app.bindMakeAnOrder(checkoutSection)
        } else{
            return
        }


    } else{
        return
    }
}

app.bindMakeAnOrder = function(element){
    var makeOrderButton = element.querySelector('.button')
    makeOrderButton.addEventListener('click', function(e){
        e.preventDefault()


        app.makeAnOrder()
    })
};

app.makeAnOrder = function(){
    var email_address = typeof(app.config.sessionToken.email_address) == 'string' ? app.config.sessionToken.email_address : false;
    if(email_address){
        var payload = {
            'email_address': email_address,
            'agreement': true
        }

        app.client.request(undefined, 'api/orders', 'POST', undefined, payload, function(statusCode, responsePayload){
            if(statusCode == 200){
                console.log(statusCode, responsePayload)
                window.location = '/customer/checkout/success'
            } else{
                console.log(statusCode, responsePayload)
            }
        })
    } else{
        app.logCustomerOut()
    }
}

// Init
app.init = function(){

    // Bind all form submissions
    app.bindForms();
    
    // Bind logout button
    app.bindLogoutButton()

    // Get the token from localstorage
    app.getSessionToken()

    // Renew token
    app.tokenRenewalLoop()

    // Load data on page
    app.loadDataOnPage()

    app.renderMenuItems()

    app.renderShoppingCartItems()


    
};

window.onload = function(){
    app.init();
}