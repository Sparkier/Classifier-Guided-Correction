import $ from 'jquery';

export default function images_explanation(dataset) {   
    const participant_id = browserStore.get('participant_id');
    if(participant_id === undefined) {
        $.ajax({
            method: 'GET',
            url: '/api/participant_id/' + dataset
        }).done((data) => {
            browserStore.set('participant_id', data.participant_id);
            storeBrowserInfo(data.participant_id);
        });
    } else {
        dispatch();
    }

    function dispatch() {
    }

    function complete() {
        window.location.href = "confusion.html";
    }
}