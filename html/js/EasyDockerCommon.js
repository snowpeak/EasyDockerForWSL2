function common_startSpinner(x_spinnerId){
    let p_spinner = document.getElementById(x_spinnerId);
    if (p_spinner) {
        p_spinner.classList.remove("d-none")
    }    
}
function common_stopSpinner(x_spinnerId){
    let p_spinner = document.getElementById(x_spinnerId);
    if (p_spinner) {
        p_spinner.classList.add("d-none")
    }    
}