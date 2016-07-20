import React from 'react';
import SortedTable from '../../common/SortedTable.jsx';
import EditMemberModalLauncher from './EditMemberModalLauncher.jsx';
import moment from 'moment';

const columns = [
  { type: 'name', field: 'memberName', label: 'Member name' },
  { type: 'name', field: 'contactNumber', label: 'Contact number' },
  { type: 'name', field: 'memberSince', label: 'Member since' },
  { type: 'name', field: 'pastoralNotes', label: 'Pastoral notes' },
  { type: 'actions' },
];

function nullToBlank(input) {
  return input === null ? '' : input;
}

const mapFields = ({ memberName,
  memberLastName,
  contactNumber,
  contactEmail,
  memberSince,
  pastoralNotes }) => (
  {
    memberName: `${memberName} ${nullToBlank(memberLastName)}`,
    contactNumber: `${contactNumber}\n${contactEmail}`,
    memberSince: moment(memberSince).format('YYYY/MM/DD'),
    pastoralNotes,
  }
);
const mapActions = (member, onSaveMember, allGroups) => [
  <EditMemberModalLauncher
    key={`${member.id}-edit`}
    member={Object.assign({}, member, { allGroups })} onSave={onSaveMember}
  />,
];

const MemberListTable = ({ members, onSaveMember, groups }) =>
  <SortedTable
    columns={columns}
    data={members.map(member =>
      Object.assign({}, mapFields(member), { actions: mapActions(member, onSaveMember, groups) })
    )}
    sortOn="memberName"
  />;

export default MemberListTable;

MemberListTable.propTypes = {
  members: React.PropTypes.array,
  groups: React.PropTypes.array,
  onSaveMember: React.PropTypes.func.isRequired,
};
