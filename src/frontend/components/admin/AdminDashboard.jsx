import React, {Component} from 'react';
import {render} from 'react-dom';
import $ from 'jquery';
import ParticipantsList from './ParticipantsList.jsx';
import AdminHeader from './AdminHeader.jsx';
import GroupsList from './GroupsList.jsx';
import GroupDetailView from './GroupDetailView.jsx';
import labService from '../../services/labService.js';
import groupService from '../../services/groupService.js';

export default class AdminDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            participants: [],
            groups: [],
            labs: [],
            selectedGroup: {},
            currentLab: '',
            filteredParticipantList: [],
            onSaveGroup: (groupDetails) => {
                groupService.createOrUpdateGroup(groupDetails, this.state.currentLab.id)
                .then( (savedGroup) => {
                    let groups = this.state.groups.slice(0);
                    let group = groups.find (g => g.id === savedGroup.id);
                    if(group) {
                        Object.assign(group, savedGroup);
                    }
                    else {
                        groups.push(savedGroup);
                    }
                    this.setState({groups: groups});
                });
            },
            onSelectGroup: (selected) => {
                let groups = this.state.groups.map(group => {
                    return Object.assign({}, group, { selected: group.id === selected.id });
                });
                this.setState({groups: groups});
                this.setState({selectedGroup: selected}, this.filterParticipantList);
            },
            onDeleteGroup: (selected) => {
            }
        };
    }

    componentDidMount() {
        labService.getMyLabs()
            .then( (labs) => {
                this.setState({labs: labs});
                this.setState({currentLab: labs[0]});
                labService.getLabPartipicants(this.state.currentLab.id)
                        .then( participants => { this.setState({participants: participants});
                                                 this.filterParticipantList();
                                                });
                labService.getLabGroups(this.state.currentLab.id)
                        .then( groups => { this.setState({groups: groups}); });
            });
    }

    filterParticipantList() {
        if (!this.state.selectedGroup) {
            this.setState({filteredParticipantList: this.state.participants});
        }
        else {
            this.setState({filteredParticipantList:
                    this.state.participants.filter( element => {
                        return element.Groups.filter( group => {
                            return group.id === this.state.selectedGroup.id;
                        }).length > 0;
                    })
            });
        }
    }

    render() {
        return (
            <div className="admin-container">
                <div className="container">
                    <AdminHeader />
                    <nav id="groups">
                        <GroupsList editable={ true } selectedGroup={this.state.selectedGroup} groups={ this.state.groups } onSave={ this.state.onSaveGroup } onSelectGroup={ this.state.onSelectGroup } />
                    </nav>
                    <GroupDetailView selectedGroup={ this.state.selectedGroup } onSave={ this.state.onSaveGroup } onDelete={ this.state.onDeleteGroup } />
                </div>
                <div className="container">
                    <ParticipantsList participants={ this.state.filteredParticipantList } groups={ this.state.groups }/>
                </div>
            </div>);
    }
}

render(<AdminDashboard />, document.getElementById('app'));
