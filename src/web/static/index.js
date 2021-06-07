let platforms = [
    "codeforces",
    "atcoder",
    "nowcoder",
    "luogu",
    "vjudge",
];

function newInput() {
    let ret = {
        "name": "",
    };
    for (let platform of platforms) {
        ret[platform] = "";
    }
    return ret;
}

function getContestDataFromResponse(response) {
    let contestData = {};
    for (let contestRecord of response.data["contest_record"]) {
        if (contestData[contestRecord.platform] === undefined) {
            contestData[contestRecord.platform] = {
                oj_name: contestRecord.platform,
                datas: [],
            };
        }
        let rating_list = [];
        for (let record of contestRecord.data.record) {
            rating_list.push([
                record.timestamp * 1000,
                record.rating,
                record.name,
                record.url,
            ]);
        }
        contestData[contestRecord.platform].datas.push({
            username: contestRecord.handle,
            user_url: contestRecord.data.profile_url,
            rating_list: rating_list,
        });
    }
    return contestData;
}

function getSubmitDataFromResponse(response) {
    let submitData = {};
    for (let submitRecord of response.data["submit_record"]) {
        if (submitData[submitRecord.platform] === undefined) {
            submitData[submitRecord.platform] = {
                oj_name: submitRecord.platform,
                datas: [],
            };
        }
        let solved_list = [];
        let source = submitRecord.data.distribution ?
            submitRecord.data.distribution : submitRecord.data.oj_distribution;
        for (let key in source) {
            let value = source[key];
            solved_list.push([key, value]);
        }
        submitData[submitRecord.platform].datas.push({
            username: submitRecord.handle,
            user_url: submitRecord.data.profile_url,
            solved_list: solved_list,
        });
    }
    return submitData;
}

function getAllShowCondition() {
    let res = {};
    for (let platform of platforms) {
        res[platform + "_contest_graph_show"] = false;
        res[platform + "_submit_graph_show"] = false;
    }
    return res;
}

new Vue({
    delimiters: ["!{", "}!"],
    el: "#app",
    data: {
        inputs: [newInput()],
        platforms: platforms,
        gaoStatus: "OK",
        show: getAllShowCondition(),
    },
    methods: {
        addMember: function () {
            this.$data.inputs.push(newInput());
        },
        gao: function () {
            if (this.$data.gaoStatus === "OK") {
                let qs = Qs;
                let app = this;
                this.$data.gaoStatus = "RUN";
                axios.post("/api/get_user_record", qs.stringify({
                    data: JSON.stringify({
                        users: this.$data.inputs,
                    }),
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    },
                }).then(function (rsp) {
                    app.$data.show = getAllShowCondition();
                    let contestData = getContestDataFromResponse(rsp);
                    let submitData = getSubmitDataFromResponse(rsp);
                    for (let platform in contestData) {
                        let dom = document.getElementById(platform + "-contest-graph");
                        draw_line_graph(dom, contestData[platform.valueOf()]);
                        app.$data.show[platform + "_contest_graph_show"] = true;
                    }
                    for (let platform in submitData) {
                        let dom = document.getElementById(platform + "-submit-graph");
                        draw_bar_graph(dom, submitData[platform.valueOf()]);
                        app.$data.show[platform + "_submit_graph_show"] = true;
                    }
                    app.$data.gaoStatus = "OK";
                });
            }
        },
    },
});
