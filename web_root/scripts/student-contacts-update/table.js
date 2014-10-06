/*global define, $j, psData*/

define(['actions', 'service', 'underscore'], function (actions, service, _) {
    'use strict';
    return {
        main: function () {
            this.addContactButton();
            this.bindEditButton();
            this.bindAddButton();
        },

        addContactButton: function () {
            //create add contact button, and bind click event handler
            /**
             * @see sDom option in dataTable() initialization.
             */
            $j('#parents-guardians-content').prepend('<button id="add-par-guar-contact">Add Contact</button>');
            $j('#emergency-contacts-content').prepend('<button id="add-emerg-contact">Add Contact</button>');

            $j('#parents-guardians-content button, #emergency-contacts-content button').button({
                icons: {
                    primary: 'ui-icon-plus'
                }
            });
            $j('.ui-button-text').css({'color': '#fff'});
        },

        bindEditButton: function () {
            var _this = this;
            $j('body').on('click', '.editcontact', function (event) {
                var $eventTarget = $j(event.target);
                var $parentRow = $eventTarget.closest('tr');
                var isParGuarContact = $parentRow.closest('#parents-guardians-table').length > 0;

                var contactData = $parentRow.data('contactData');
                actions.editContact(contactData, $parentRow, isParGuarContact);
                _this.bindSaveButton(isParGuarContact);
            });
        },

        /**
         *
         * @param isParGuarContact {Boolean}
         */
        bindSaveButton: function (isParGuarContact) {
            $j('.savecontact').on('click', function (event) {
                var $eventTarget = $j(event.target);
                var $closestRow = $eventTarget.closest('tr');
                var contactData = actions.deserializeContact($closestRow);

                var ajaxFunc;

                var stagingContactsAjax;
                if (isParGuarContact) {
                    stagingContactsAjax = service.getParGuarsStaging({studentsdcid: psData.studentsDcid});
                } else {
                    stagingContactsAjax = service.getEmergContsStaging({studentsdcid: psData.studentsDcid});
                }

                stagingContactsAjax.done(function (stagingContacts) {
                    /* If the contactData object is not present in the current row,
                     * this is a new contact.
                     * @see actions.renderContact
                     */
                    var contactInitData = $closestRow.data().contactData;
                    var stagingRecordId;

                    if (contactInitData) {
                        var stagingTableName = stagingContacts.name.toLowerCase();
                        _.each(stagingContacts.record, function (contact) {
                            if (contactInitData.contact_id === contact.tables[stagingTableName].contact_id) {
                                stagingRecordId = contactInitData.id;
                            }
                        });
                    }

                    if (stagingRecordId) {
                        ajaxFunc = actions.updateStagingContact(contactData, stagingRecordId);
                    } else if (contactInitData) {
                        ajaxFunc = actions.newStagingContact(contactData, psData.studentsDcid, isParGuarContact, contactInitData.contact_id);
                    } else {
                        ajaxFunc = actions.newStagingContact(contactData, psData.studentsDcid, isParGuarContact, contactInitData.contact_id);
                    }

                    ajaxFunc.done(function (resp) {
                        contactData.contact_id = contactInitData.contact_id;
                        contactData.id = contactInitData.id;
                        actions.renderContact(contactData, $closestRow, true);
                    });
                });
            });
        },
        bindAddButton: function () {
            var _this = this;
            $j('#add-par-guar-contact, #add-emerg-contact').on('click', function(event) {
                var $target = $j(event.target);
                var addParGuar = $target.closest('button').attr('id') === 'add-par-guar-contact';
                var buttonTable = addParGuar ? '#parents-guardians-table' : '#emergency-contacts-table';
                var insertSelector = $j(buttonTable).find('tbody tr').last();
                var newRow = $j('<tr></tr>');
                newRow.insertAfter(insertSelector);
                actions.addContact(newRow, addParGuar);
                _this.bindSaveButton(addParGuar);
            });
        }
    };
});