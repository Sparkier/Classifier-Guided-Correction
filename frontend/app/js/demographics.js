import $ from 'jquery';
import * as browserStore from 'storejs';
import * as survey from 'survey-jquery';

export default function demographics(dataset) {   
    survey.defaultBootstrapCss.navigationButton = "btn btn-primary";
    survey.Survey.cssType = "bootstrap";
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
        $.ajax({
            method: 'GET',
            url: '/api/demographics_survey/'
        }).done((data) => {
            var model = new survey.Model(data);
            $("#surveyElement").Survey({model:model});
            model.onComplete.add(function (sender) {
                var mySurvey = sender;
                var surveyData = sender.data;
                complete(surveyData);
            });
        });
    }

    function complete(surveyData) {
        $.ajax({
            method: 'PUT',
            url: '/api/client_demographics/' + dataset + '/' + participant_id,
            data: JSON.stringify({surveyData}),
            contentType: 'application/json'
        }).done(() => {
            setTimeout(function () {
                window.location.href = "confusion.html";
            }, 10000);
        });
    }
}