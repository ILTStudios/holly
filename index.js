const API_KEY = 'AIzaSyAUqkn7UBJZ6rOHibAZSj8C_UuXerEnnDE';
const SPREADSHEET_ID = '1dIv5yxlqlXs0ZcR9P8dzZWKdqVDGiBVvK73NMXuLMNo';
const range = 'Sheet1!A1:E20';

let sheet_data = []

// fetches data from sheet //
async function fetchData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        return data.values
    } catch (err) {
        console.error('Error fetching data:', err);
        return []
    }
}

// function to update sheet data // 
function update_data(){
    sheet_data = []
    fetchData().then(data => {
        // console.log('Fetched data: ', data);
        data.forEach(element => {
            sheet_data.push(element)
        });
        current_question_num = sheet_data[0][4]
        let match = sheet_data.find(element => element[0] === current_question_num);
        if(match){
            let content = match[1];
            document.querySelector('.header').textContent = content;
        }else{
            document.querySelector('.header').textContent = "Error 404: Question Not Found :d";
        }
    });
}

// admin commands //
function admin_command(value){
    command_body = value.slice(2).trim()

    const match = command_body.match(/^(\w+)(?:\((.*)\))?$/);

    command_name = match[1]
    param_string = match[2]

    let params = {}
    
    if(param_string){
        param_string.split(',').forEach(pair => {
            const [key, value] = pair.split('=').map(s => s.trim());
            params[key] = parseValue(value);
        });
    }
    const entries = Object.entries(params)
    const [key, first_val] = entries[0]

    if (!match) {
        console.log("Invalid command format.");
        return;
    }

    switch(command_name){
        case 'update':
            update_data()
            break
        case 'restart':
            console.log("Restarted!")
            break
        case 'updateTo':
            fetch('https://script.google.com/macros/s/AKfycbzgx59qtMvc1b-WYmAQvZi9sdwcw4e3NtapA5x3QKr72hrIExJSnGxtn-qzdH8wJtgI/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `cell=${encodeURIComponent(key)}&value=${encodeURIComponent(first_val)}`
            }).then(res => res.text()).then(msg => {
                console.log(msg);
            }).catch(err => {
                console.error('Error updating cell:', err);
            }).finally(() => {
                update_data();
            });
            break
    }
}

function parseValue(value) {
    if (!isNaN(value)) return Number(value);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}

// handles all form submits //
document.querySelector('#answer_form').addEventListener('submit', (element) => {
    element.preventDefault()
    value = document.querySelector('.answer').value
    if(value.includes('_!')){
        admin_command(value)
    }

    document.querySelector('.answer').value = ''

    sheet_data.forEach(row => {
        if(row.includes(value)){
            // console.log("Correct!")
            counter = Number(sheet_data[0][4]) + 1
            newValue = counter.toString()
            sheet_data[0][4] = counter.toString()

            fetch('https://script.google.com/macros/s/AKfycbzgx59qtMvc1b-WYmAQvZi9sdwcw4e3NtapA5x3QKr72hrIExJSnGxtn-qzdH8wJtgI/exec', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `value=${encodeURIComponent(newValue)}`
            }).then(res => res.text())
            .then(msg => msg = msg)
            .catch(err => err = err)
            //console.error('Error updating cell:', err)
            .finally(() => {
                update_data()
            });
        }
    });
});

// set initial conditions //
update_data()